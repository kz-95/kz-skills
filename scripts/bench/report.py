#!/usr/bin/env python3
"""Print the Markdown tables for docs/benchmark.md from results files written by run.py, scored by
score.mjs, and (optionally) a judge file written by judge.mjs.

    python scripts/bench/report.py scripts/bench/results/after-2026-10-14.json \
        scripts/bench/results/before-v2-2026-10-14.json --judge scripts/bench/results/judge-2026-10-14.json

Rows are (condition, skill version) per model. Factors are per task: the cell's median over the
task's median in `none` (same model), then the median over tasks, with the range over tasks.
`tokens_total` = input + cache write + cache read + output, which does not depend on cache hits;
cost is total_cost_usd as the CLI returns it, which does. Check failures are the failures the
agent introduced (the run's count minus the untouched starter's), summed over 1280 and 390.
The BEFORE file's names (kz, kz-slash, no version) are read as installed and uiuxrule, version v1.
"""
import argparse
import glob
import json
import os
import statistics as st
from datetime import datetime

COND_ORDER = ["none", "installed", "uiuxrule", "flashrule", "fastfix"]
VER_ORDER = ["-", "v1", "before", "after"]
ALIASES = {"kz": "installed", "kz-slash": "uiuxrule"}
LABEL = {"none": "none", "installed": "installed", "uiuxrule": "/kz-uiuxrule", "flashrule": "/kz-flashrule",
         "fastfix": "/kz-fastfix"}
SMALL_TASKS = ["trivial-label", "small-column", "dark-mode", "iterate-html"]


def med(xs):
    xs = [x for x in xs if x is not None]
    return st.median(xs) if xs else None


def ts(e):
    t = e.get("timestamp")
    return datetime.fromisoformat(t.replace("Z", "+00:00")).timestamp() if t else None


def tool_timing(cfg):
    """Seconds inside tool calls, those that touched the kz skills, and kz-uicheck calls."""
    out = {"tool_s": 0.0, "kz_tool_s": 0.0, "uicheck_calls": 0}
    if not cfg or not os.path.isdir(cfg):
        return out
    start = {}
    for path in glob.glob(os.path.join(cfg, "projects", "**", "*.jsonl"), recursive=True):
        for line in open(path, encoding="utf-8"):
            try:
                e = json.loads(line)
            except ValueError:
                continue
            c = (e.get("message") or {}).get("content")
            if not isinstance(c, list):
                continue
            for x in c:
                if not isinstance(x, dict):
                    continue
                if x.get("type") == "tool_use":
                    start[x["id"]] = (ts(e), x)
                elif x.get("type") == "tool_result" and x.get("tool_use_id") in start:
                    t0, use = start.pop(x["tool_use_id"])
                    t1 = ts(e)
                    d = (t1 - t0) if (t0 and t1) else 0
                    blob = json.dumps(use.get("input", {}))
                    out["tool_s"] += d
                    if "/skills/kz-" in blob or "kz-uicheck" in blob or "run-checks" in blob:
                        out["kz_tool_s"] += d
                    if "run-checks" in blob or "-check.js" in blob:
                        out["uicheck_calls"] += 1
    return out


def fk(n):
    return "-" if n is None else ("%.0fk" % (n / 1000.0))


def fx(x):
    return "-" if x is None else "%.2fx" % x


def norm(r):
    r["condition"] = ALIASES.get(r.get("condition"), r.get("condition"))
    if not r.get("version"):
        r["version"] = "-" if r["condition"] == "none" else "v1"
    r.setdefault("model", None)
    r.setdefault("tokens_total", sum(r.get(k, 0) or 0 for k in ("input_tokens", "cache_creation_input_tokens",
                                                                    "cache_read_input_tokens", "output_tokens")))
    for t in r.get("turns", []):
        t.setdefault("tokens_total", sum(t.get(k, 0) or 0 for k in ("input_tokens", "cache_creation_input_tokens",
                                                                        "cache_read_input_tokens", "output_tokens")))
    return r


def quality(r, starters):
    s = r.get("score") or {}
    u = s.get("uicheck") or {}
    if not u.get("1280", {}).get("runs") or not u.get("390", {}).get("runs"):
        intro = None
    elif s.get("introduced"):
        intro = s["introduced"]["1280"] + s["introduced"]["390"]
    else:
        base = starters.get(r["task"], {}).get("uicheck", {})
        intro = (u["1280"]["failures"] - base.get("1280", {}).get("failures", 0) +
                 u["390"]["failures"] - base.get("390", {}).get("failures", 0))
    lh = s.get("lighthouse") or {}
    return {"intro": intro, "rubric": s.get("rubric_pass"), "rubric_total": s.get("rubric_total"),
            "axe": (s.get("axe") or {}).get("serious_critical"),
            "lh_a11y": lh.get("accessibility"), "lh_bp": lh.get("best_practices")}


def cell_stats(rs, starters):
    q = [quality(r, starters) for r in rs]
    return {"n": len(rs), "wall": med([r["wall_s"] for r in rs]), "wall_min": min(r["wall_s"] for r in rs),
            "wall_max": max(r["wall_s"] for r in rs), "turns": med([r["num_turns"] for r in rs]),
            "tok": med([r["tokens_total"] for r in rs]), "out": med([r.get("output_tokens") for r in rs]),
            "cost": med([r["total_cost_usd"] for r in rs]), "kb": med([r.get("skill_bytes_read", 0) / 1024 for r in rs]),
            "intro": med([x["intro"] for x in q]), "rubric": med([x["rubric"] for x in q]),
            "rubric_total": max([x["rubric_total"] or 0 for x in q] or [0]), "axe": med([x["axe"] for x in q]),
            "lh_a11y": med([x["lh_a11y"] for x in q]), "lh_bp": med([x["lh_bp"] for x in q]),
            "asked": sum(1 for r in rs if r.get("asked")),
            "uicheck_runs": sum(1 for r in rs if r["_timing"]["uicheck_calls"]),
            "uicheck_calls": med([r["_timing"]["uicheck_calls"] for r in rs])}


def judge_line(judge, model, cond):
    cs = [c for c in judge if c.get("model") == model and c.get("kz_condition") == cond and c.get("result")]
    if not cs:
        return "-", None
    w = sum(1 for c in cs if c["result"] == "kz")
    lo = sum(1 for c in cs if c["result"] == "none")
    ti = sum(1 for c in cs if c["result"] == "tie")
    return "%d%% (%d-%d-%d of %d)" % (round(100.0 * w / len(cs)), w, lo, ti, len(cs)), (w, lo, ti, len(cs))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--judge", default=None)
    a = ap.parse_args()
    runs, starters, total_cost = [], {}, 0.0
    for f in a.files:
        d = json.load(open(f))
        starters.update(d.get("starters") or {})
        total_cost += d.get("total_cost_usd", 0) or 0
        runs += [norm(r) for r in d["runs"] if r.get("task") and not r.get("skipped") and r.get("mode") == "scored"]
    judge = json.load(open(a.judge))["comparisons"] if a.judge else []
    judge_cost = sum(c.get("cost") or 0 for c in judge)
    for r in runs:
        r["_timing"] = tool_timing(r.get("config"))
    models = sorted({r["model"] or "default" for r in runs}, key=lambda m: ("opus" in m, m))
    for r in runs:
        r["model"] = r["model"] or "default"
    for model in models:
        mr = [r for r in runs if r["model"] == model]
        tasks = [t for t in ["trivial-label", "small-column", "dark-mode", "table-build", "chart-filter", "form-build",
                             "iterate-html"] if any(r["task"] == t for r in mr)]
        keys = sorted({(r["condition"], r["version"]) for r in mr},
                      key=lambda k: (COND_ORDER.index(k[0]), VER_ORDER.index(k[1])))
        cells = {}
        for k in keys:
            for t in tasks:
                rs = [r for r in mr if (r["condition"], r["version"]) == k and r["task"] == t]
                if rs:
                    cells[(k, t)] = cell_stats(rs, starters)
        base = {t: cells.get((("none", "-"), t)) for t in tasks}
        print("### %s\n" % model)
        print("#### Summary\n")
        print("| condition | skills | tasks | wall time vs none | tokens_total vs none | cost vs none | "
              "kz-check failures introduced | rubric | axe serious+critical | Lighthouse a11y | judge: kz preferred (W-L-T) |")
        print("|---|---|---|---|---|---|---|---|---|---|---|")
        rows = list(keys)
        if any(k[0] == "fastfix" for k in keys):          # none on the same small tasks, for the fastfix row
            rows.insert(1, ("none", "small"))
        for k in rows:
            if k == ("none", "small"):
                ts_ = [t for t in tasks if t in SMALL_TASKS and (("none", "-"), t) in cells]
                cs = [cells[(("none", "-"), t)] for t in ts_]
                label, ver = "none (small tasks only)", "-"
            else:
                ts_ = [t for t in tasks if (k, t) in cells]
                cs = [cells[(k, t)] for t in ts_]
                label, ver = LABEL[k[0]], k[1]
            def factors(key):
                xs = [cells[(k if k != ("none", "small") else ("none", "-"), t)][key] / base[t][key]
                      for t in ts_ if base.get(t) and base[t][key]]
                if not xs:
                    return "-"
                return "%s (%s-%s)" % (fx(med(xs)), fx(min(xs)), fx(max(xs)))
            intro = sum(c["intro"] or 0 for c in cs)
            rub = sum(c["rubric"] or 0 for c in cs)
            rtot = sum(c["rubric_total"] for c in cs)
            axe = sum(c["axe"] or 0 for c in cs) if any(c["axe"] is not None for c in cs) else "-"
            lh = med([c["lh_a11y"] for c in cs])
            jl = judge_line(judge, model, k[0])[0] if (k[1] == "after" and k[0] in ("uiuxrule", "flashrule")) else "-"
            print("| %s | %s | %d | %s | %s | %s | %g | %g/%d | %s | %s | %s |" % (
                label, ver, len(ts_), factors("wall"), factors("tok"), factors("cost"), intro, rub, rtot, axe,
                "-" if lh is None else "%.2f" % lh, jl))
        print()
        print("#### Per task\n")
        print("Medians over the runs in each cell (n); wall time range in brackets.\n"
              "Failures are those the agent introduced (run minus starter), at 1280 + 390.\n"
              "LH is Lighthouse mobile accessibility / best practices.\n")
        for t in tasks:
            print("##### %s\n" % t)
            print("| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |")
            print("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
            for k in keys:
                c = cells.get((k, t))
                if not c:
                    continue
                print("| %s | %s | %d | %.0f (%.0f-%.0f) | %g | %s | %.3f | %.1f | %s | %s/%d | %s | %s/%s | %d/%d |" % (
                    LABEL[k[0]], k[1], c["n"], c["wall"], c["wall_min"], c["wall_max"], c["turns"], fk(c["tok"]),
                    c["cost"], c["kb"], "-" if c["intro"] is None else "%g" % c["intro"],
                    "-" if c["rubric"] is None else "%g" % c["rubric"], c["rubric_total"],
                    "-" if c["axe"] is None else "%g" % c["axe"],
                    "-" if c["lh_a11y"] is None else "%.2f" % c["lh_a11y"], "-" if c["lh_bp"] is None else "%.2f" % c["lh_bp"],
                    c["uicheck_runs"], c["n"]))
            print()
        it = [r for r in mr if r["task"] == "iterate-html"]
        if it:
            print("#### Iteration loop, per turn (medians over runs)\n")
            print("| condition | skills | turn | prompt | wall s | turns | tokens_total | cost USD | skill KB |")
            print("|---|---|---|---|---|---|---|---|---|")
            for k in keys:
                rs = [r for r in it if (r["condition"], r["version"]) == k]
                if not rs:
                    continue
                for j in range(max(len(r["turns"]) for r in rs)):
                    tr = [r["turns"][j] for r in rs if len(r["turns"]) > j]
                    p = tr[0]["prompt"].split(".")[0][:46]
                    print("| %s | %s | %d | %s | %.0f | %g | %s | %.3f | %.1f |" % (
                        LABEL[k[0]], k[1], j + 1, p, med([x["wall_s"] for x in tr]), med([x["num_turns"] for x in tr]),
                        fk(med([x["tokens_total"] for x in tr])), med([x["total_cost_usd"] for x in tr]),
                        med([x["skill_bytes_read"] / 1024 for x in tr])))
            print()
        print("#### Routing and asking\n")
        print("| condition | skills | runs | skills the model invoked (runs) | runs that asked | runs with a permission denial | runs that ran kz-uicheck | median kz-uicheck calls |")
        print("|---|---|---|---|---|---|---|---|")
        for k in keys:
            rs = [r for r in mr if (r["condition"], r["version"]) == k]
            inv = {}
            for r in rs:
                for s in set(x for x in (r.get("skills_invoked") or []) if x):
                    inv[s] = inv.get(s, 0) + 1
            print("| %s | %s | %d | %s | %d | %d | %d | %g |" % (
                LABEL[k[0]], k[1], len(rs), "; ".join("%s (%d)" % kv for kv in sorted(inv.items(), key=lambda kv: -kv[1])) or "none",
                sum(1 for r in rs if r.get("asked")), sum(1 for r in rs if r.get("permission_denials")),
                sum(1 for r in rs if r["_timing"]["uicheck_calls"]), med([r["_timing"]["uicheck_calls"] for r in rs])))
        print()
    if judge:
        print("### Judge, per task (kz preferred W-L-T)\n")
        print("| model | task | /kz-uiuxrule vs none | /kz-flashrule vs none |")
        print("|---|---|---|---|")
        for model in models:
            for t in sorted({c["task"] for c in judge if c["model"] == model}):
                row = []
                for kc in ("uiuxrule", "flashrule"):
                    cs = [c for c in judge if c["model"] == model and c["task"] == t and c["kz_condition"] == kc and c.get("result")]
                    row.append("%d-%d-%d" % (sum(c["result"] == "kz" for c in cs), sum(c["result"] == "none" for c in cs),
                                             sum(c["result"] == "tie" for c in cs)) if cs else "-")
                print("| %s | %s | %s | %s |" % (model, t, row[0], row[1]))
        print()
    print("Agent spend in these files: USD %.2f; judge: USD %.2f; total USD %.2f" % (total_cost, judge_cost, total_cost + judge_cost))


if __name__ == "__main__":
    main()
