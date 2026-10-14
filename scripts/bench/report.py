#!/usr/bin/env python3
"""Print the Markdown tables for docs/benchmark.md from a results file written by run.py and
scored by score.mjs.

    python scripts/bench/report.py scripts/bench/results/before-2026-10-14.json

Per task: one row per condition, medians over the scored runs, with the range of wall time when
there is more than one run. "asked" comes from the probe runs (bare prompt, no assume-suffix).
It also re-reads each run's transcript (still under the run's config dir, if it exists) to time
the tool calls that touched the kz skills, which is where the evidence for slowness comes from.
"""
import glob
import json
import os
import statistics as st
import sys
from datetime import datetime

COND_ORDER = ["none", "kz", "kz-slash"]


def med(xs):
    xs = [x for x in xs if x is not None]
    return st.median(xs) if xs else None


def ts(e):
    t = e.get("timestamp")
    return datetime.fromisoformat(t.replace("Z", "+00:00")).timestamp() if t else None


def tool_timing(cfg):
    """Seconds spent inside tool calls, split into those that touched the kz skills and the rest,
    plus how many times the kz-uicheck runner or a check ran."""
    out = {"tool_s": 0.0, "kz_tool_s": 0.0, "uicheck_calls": 0, "skill_files": {}}
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
                    fp = use.get("input", {}).get("file_path", "")
                    if use.get("name") == "Read" and "/skills/kz-" in fp:
                        k = fp.split("/skills/", 1)[1]
                        out["skill_files"][k] = out["skill_files"].get(k, 0) + 1
    return out


def fmt_k(n):
    return "%.0fk" % (n / 1000.0) if n is not None else "-"


def main():
    doc = json.load(open(sys.argv[1]))
    runs = [r for r in doc["runs"] if r.get("task")]
    scored = [r for r in runs if r["mode"] == "scored" and not r.get("skipped")]
    probes = [r for r in runs if r["mode"] == "probe" and not r.get("skipped")]
    tasks = []
    for r in scored:
        if r["task"] not in tasks:
            tasks.append(r["task"])
    for r in scored:
        r["_timing"] = tool_timing(r.get("config"))
    summary = {}
    print("## Results per task\n")
    print("Medians over %s scored run(s) per cell; wall time range in brackets. Tokens in = input + cache "
          "write + cache read. Asked = probe runs that stopped to ask / probe runs.\n"
          % ", ".join(sorted({str(sum(1 for x in scored if x['task'] == t and x['condition'] == 'none')) for t in tasks})))
    for t in tasks:
        print("### %s\n" % t)
        print("| condition | wall s | turns | tokens in/out | cost USD | asked? | skill KB read | check failures 1280/390 | rubric |")
        print("|---|---|---|---|---|---|---|---|---|")
        for c in COND_ORDER:
            rs = [r for r in scored if r["task"] == t and r["condition"] == c]
            if not rs:
                continue
            ps = [r for r in probes if r["task"] == t and r["condition"] == c]
            walls = [r["wall_s"] for r in rs]
            tin = med([r["input_tokens"] + r["cache_creation_input_tokens"] + r["cache_read_input_tokens"] for r in rs])
            tout = med([r["output_tokens"] for r in rs])
            sc = [r.get("score") or {} for r in rs]
            ok = lambda u: u.get("failures") if u.get("runs") else None    # runs 0: the runner errored
            f1 = med([ok(s.get("uicheck", {}).get("1280", {})) for s in sc])
            f2 = med([ok(s.get("uicheck", {}).get("390", {})) for s in sc])
            rub = med([s.get("rubric_pass") for s in sc])
            tot = max([s.get("rubric_total") or 0 for s in sc] or [0])
            asked = "%d/%d" % (sum(1 for p in ps if p.get("asked")), len(ps)) if ps else "-"
            rng = " (%.0f-%.0f)" % (min(walls), max(walls)) if len(walls) > 1 else ""
            print("| %s | %.0f%s | %s | %s / %s | %.3f | %s | %.1f | %s / %s | %s/%d |" % (
                c, med(walls), rng, med([r["num_turns"] for r in rs]), fmt_k(tin), fmt_k(tout),
                med([r["total_cost_usd"] for r in rs]), asked, med([r["skill_bytes_read"] for r in rs]) / 1024,
                f1, f2, rub, tot))
            summary.setdefault(c, {})[t] = {"wall": med(walls), "cost": med([r["total_cost_usd"] for r in rs]),
                                            "rubric": rub, "tot": tot, "fail": (f1 or 0) + (f2 or 0)}
        print()
    print("## Summary\n")
    print("| condition | median slowdown vs none (wall) | range over tasks | median cost factor | rubric passed (all tasks) | check failures (all tasks, both widths) |")
    print("|---|---|---|---|---|---|")
    base = summary.get("none", {})
    for c in COND_ORDER:
        if c not in summary:
            continue
        ratios = [summary[c][t]["wall"] / base[t]["wall"] for t in summary[c] if t in base and base[t]["wall"]]
        costs = [summary[c][t]["cost"] / base[t]["cost"] for t in summary[c] if t in base and base[t]["cost"]]
        rp = sum(v["rubric"] or 0 for v in summary[c].values())
        rt = sum(v["tot"] for v in summary[c].values())
        fl = sum(v["fail"] for v in summary[c].values())
        print("| %s | %.2fx | %.2fx-%.2fx | %.2fx | %g/%d | %g |" % (c, med(ratios), min(ratios), max(ratios), med(costs), rp, rt, fl))
    print()
    it = [r for r in scored if r["task"] == "iterate-html"]
    if it:
        print("## Iteration loop, per turn\n")
        print("| condition | run | turn | prompt | wall s | turns | tokens in/out | cost USD | skill KB read |")
        print("|---|---|---|---|---|---|---|---|---|")
        for c in COND_ORDER:
            for i, r in enumerate([r for r in it if r["condition"] == c]):
                for j, tr in enumerate(r["turns"]):
                    tin = tr["input_tokens"] + tr["cache_creation_input_tokens"] + tr["cache_read_input_tokens"]
                    p = tr["prompt"].replace("/kz-uiuxrule ", "/kz-uiuxrule: ").split(".")[0][:48]
                    print("| %s | %d | %d | %s | %.0f | %s | %s / %s | %.3f | %.1f |" % (
                        c, i + 1, j + 1, p, tr["wall_s"], tr["num_turns"], fmt_k(tin), fmt_k(tr["output_tokens"]),
                        tr["total_cost_usd"], tr["skill_bytes_read"] / 1024))
        print()
    print("## Evidence from transcripts\n")
    print("| condition | runs | runs that invoked a kz skill | median tool s | median kz tool s | runs that ran kz-uicheck | kz files Read (runs) |")
    print("|---|---|---|---|---|---|---|")
    for c in COND_ORDER:
        rs = [r for r in scored if r["condition"] == c]
        if not rs:
            continue
        files = {}
        for r in rs:
            for k in r["_timing"]["skill_files"]:
                files[k] = files.get(k, 0) + 1
        inv = sum(1 for r in rs if any((k or "").startswith("kz-") for k in r.get("skills_invoked") or [])
                  or r["condition"] == "kz-slash")
        print("| %s | %d | %d | %.0f | %.0f | %d | %s |" % (
            c, len(rs), inv, med([r["_timing"]["tool_s"] for r in rs]), med([r["_timing"]["kz_tool_s"] for r in rs]),
            sum(1 for r in rs if r["_timing"]["uicheck_calls"]),
            "; ".join("%s (%d)" % kv for kv in sorted(files.items(), key=lambda kv: -kv[1])) or "-"))
    print()
    print("Total spend in this file: USD %.2f" % doc.get("total_cost_usd", 0))


if __name__ == "__main__":
    main()
