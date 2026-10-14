#!/usr/bin/env python3
"""Run the kz-skills benchmark: each task under each condition, skill version and model, headless,
and record time, tokens and cost.

    python scripts/bench/run.py --plan full --label after         the AFTER matrix (see README)
    python scripts/bench/run.py --tasks chart-filter --conditions none,uiuxrule --versions after
    python scripts/bench/run.py --probe                           also run the 'does it stop to ask' probe

Conditions:
  none       an empty, isolated CLAUDE_CONFIG_DIR: no skills, no hooks. Version-independent.
  installed  skills/* copied into <config>/skills/ and the purpose hook wired on PreToolUse(Skill)
             and UserPromptSubmit, as skills/kz-askcard/hooks/README.md says. The model decides
             whether to invoke a skill. (Called `kz` in the BEFORE file.)
  uiuxrule   the same install, the first prompt sent as "/kz-uiuxrule <prompt>". (`kz-slash` before.)
  flashrule  the same install, the first prompt sent as "/kz-flashrule <prompt>".
  fastfix    the same install, small tasks only (SMALL_TASKS). The prompt is sent as
             "/kz-fastfix <prompt>"; on iterate-html the build prompt is sent bare and each
             follow-up as "/kz-fastfix <follow-up>", because the follow-ups are the small edits.
  Other slash conditions send iterate-html's follow-ups as typed, without a slash.

Versions: `after` installs this working tree's skills/; `before` installs skills/ as on
--before-ref (default origin/main), extracted read-only with git archive. `none` runs once,
with version "-".

Modes:
  scored  the task prompt plus ASSUME_SUFFIX, so a run that would ask a question proceeds instead.
  probe   the bare task prompt with --max-turns PROBE_TURNS; records whether the agent stops to ask.

Fairness: every cell's repeat k runs in round k; within a round the jobs of all cells are shuffled
with --seed, so conditions, versions and models interleave. At most --jobs run at once. The seed
and each run's place in the order, start time, CLI version and model ids are recorded.

Permissions: children run with --permission-mode acceptEdits and --allowedTools CHILD_TOOLS
(file tools, Skill, subagents and Bash; no web tools), not bypassPermissions, which an agent
host's safety check may refuse to launch. Any denial is recorded per run (`permission_denials`).
Same list for every condition.

Each run gets a fresh copy of the task folder (git init + one commit) and a fresh config dir under
--work. Spending: no new run starts once the summed total_cost_usd passes --budget, and each
claude call carries --max-budget-usd (--run-budget). The results file is rewritten after every
run, so an interrupted batch keeps what finished. This script spends real money.
"""
import argparse
import concurrent.futures as cf
import datetime
import glob
import json
import os
import random
import shutil
import subprocess
import sys
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
TASKS_DIR = os.path.join(HERE, "tasks")
RESULTS_DIR = os.path.join(HERE, "results")
ASSUME_SUFFIX = "If you would ask me something, assume the recommended option and proceed."
PROBE_TURNS = 8
TASKS = ["trivial-label", "small-column", "dark-mode", "table-build", "chart-filter", "form-build", "iterate-html"]
SMALL_TASKS = ["trivial-label", "small-column", "dark-mode", "iterate-html"]
CONDITIONS = ["none", "installed", "uiuxrule", "flashrule", "fastfix"]
SLASH = {"uiuxrule": "/kz-uiuxrule ", "flashrule": "/kz-flashrule ", "fastfix": "/kz-fastfix "}
ALIASES = {"kz": "installed", "kz-slash": "uiuxrule"}      # BEFORE-file names
# The AFTER matrix: per model, the conditions per version and the repeats.
FULL_PLAN = {
    "claude-sonnet-5-5": {"repeat": 3, "cells": [("none", "-"), ("installed", "before"), ("uiuxrule", "before"),
                                                 ("installed", "after"), ("uiuxrule", "after"),
                                                 ("flashrule", "after"), ("fastfix", "after")]},
    "claude-opus-5-5": {"repeat": 2, "cells": [("none", "-"), ("uiuxrule", "before"), ("uiuxrule", "after"),
                                               ("flashrule", "after"), ("fastfix", "after")]},
}
CHILD_TOOLS = "Read,Edit,Write,MultiEdit,Glob,Grep,Skill,TodoWrite,Task,Agent,Bash"
# Variables the parent session sets that would leak into a child run (session ids, extra
# CLAUDE.md folders, skill/plugin sync). Removed for every condition alike.
STRIP_ENV = ["CLAUDECODE", "CLAUDE_CODE_SESSION_ID", "CLAUDE_CODE_CHILD_SESSION",
             "CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD", "CLAUDE_ADDITIONAL_DIRECTORIES",
             "CLAUDE_CODE_SYNC_SKILLS", "CLAUDE_CODE_SYNC_PLUGINS", "CLAUDE_CODE_REMOTE_SESSION_ID",
             "CLAUDE_CODE_TEE_SDK_STDOUT", "CLAUDE_CODE_MESSAGING_SOCKET", "CLAUDE_CODE_DIAGNOSTICS_FILE",
             "CLAUDE_EFFORT", "CLAUDE_CONFIG_DIR"]
SKILL_MARKERS = ("/skills/kz-",)
CHROME = os.environ.get("CHROME", "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell")
TOKEN_KEYS = ("input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens")

lock = threading.Lock()
spent = [0.0]


def sh(cmd, cwd=None, env=None, timeout=None):
    return subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)


def skills_source(version, work, before_ref):
    """The skills/ folder to install: this tree for `after`, an extracted copy of before_ref for `before`."""
    if version != "before":
        return os.path.join(REPO, "skills")
    dst = os.path.join(work, "skills-before")
    with lock:
        if not os.path.isdir(os.path.join(dst, "skills")):
            os.makedirs(dst, exist_ok=True)
            arc = subprocess.run(["git", "archive", before_ref, "skills"], cwd=REPO, capture_output=True, check=True)
            subprocess.run(["tar", "-x", "-C", dst], input=arc.stdout, check=True)
    return os.path.join(dst, "skills")


def make_config(cfg, condition, src):
    os.makedirs(cfg, exist_ok=True)
    if condition == "none":
        return
    dst = os.path.join(cfg, "skills")
    os.makedirs(dst, exist_ok=True)
    for name in sorted(os.listdir(src)):
        if os.path.isdir(os.path.join(src, name)):
            shutil.copytree(os.path.join(src, name), os.path.join(dst, name))
    hook = os.path.join(dst, "kz-askcard", "hooks", "ui-rule-purpose.mjs")
    entry = {"type": "command", "command": 'node "%s"' % hook, "timeout": 5}
    settings = {"hooks": {"PreToolUse": [{"matcher": "Skill", "hooks": [entry]}],
                          "UserPromptSubmit": [{"hooks": [entry]}]}}
    with open(os.path.join(cfg, "settings.json"), "w") as f:
        json.dump(settings, f, indent=2)


def make_workdir(task, wd):
    src = os.path.join(TASKS_DIR, task)
    shutil.copytree(src, wd, ignore=shutil.ignore_patterns("prompt.md", "followups.json"))
    sh(["git", "init", "-q"], cwd=wd)
    sh(["git", "add", "-A"], cwd=wd)
    sh(["git", "-c", "user.name=bench", "-c", "user.email=bench@example.invalid",
        "commit", "-qm", "starter"], cwd=wd)


def child_env(cfg):
    env = {k: v for k, v in os.environ.items() if k not in STRIP_ENV}
    env["CLAUDE_CONFIG_DIR"] = cfg
    # A user's machine has a browser; without this, kz-uicheck's runner stops at "Chrome not
    # found" and the kz runs look cheaper than they are. Set for every condition.
    env.setdefault("CHROME", CHROME)
    return env


def claude(prompt, wd, cfg, resume=None, max_turns=None, max_budget=None, model=None):
    cmd = ["claude", "-p", prompt, "--output-format", "json", "--permission-mode", "acceptEdits",
           "--allowedTools", CHILD_TOOLS]
    if model:
        cmd += ["--model", model]
    if resume:
        cmd += ["--resume", resume]
    if max_turns:
        cmd += ["--max-turns", str(max_turns)]
    if max_budget:
        cmd += ["--max-budget-usd", str(max_budget)]
    t0 = time.time()
    p = sh(cmd, cwd=wd, env=child_env(cfg), timeout=3600)
    wall = time.time() - t0
    try:
        out = json.loads(p.stdout.strip().splitlines()[-1])
    except Exception:
        out = {"is_error": True, "result": (p.stdout + p.stderr)[-2000:]}
    return wall, out


def transcript_events(cfg):
    """Every line of every session transcript (main and subagent) under <cfg>/projects."""
    ev = []
    for path in sorted(glob.glob(os.path.join(cfg, "projects", "**", "*.jsonl"), recursive=True)):
        with open(path, encoding="utf-8") as f:
            for line in f:
                try:
                    ev.append(json.loads(line))
                except ValueError:
                    pass
    return ev


def text_len(content):
    if isinstance(content, str):
        return len(content.encode("utf-8"))
    if isinstance(content, list):
        return sum(text_len(c.get("text", "")) if isinstance(c, dict) else 0 for c in content)
    return 0


def analyse(events, seen):
    """Tool use and skill reading in events whose uuid is not in `seen` (adds them to it)."""
    uses, results = {}, {}
    skills_invoked, tools, skill_reads, asked_tool = [], {}, {}, False
    skill_loaded_bytes = 0
    for e in events:
        u = e.get("uuid")
        if u in seen:
            continue
        seen.add(u)
        msg = e.get("message") or {}
        content = msg.get("content")
        if e.get("type") == "assistant" and isinstance(content, list):
            for c in content:
                if c.get("type") == "tool_use":
                    uses[c["id"]] = c
                    tools[c["name"]] = tools.get(c["name"], 0) + 1
                    if c["name"] == "Skill":
                        skills_invoked.append(c["input"].get("skill") or c["input"].get("command"))
                    if c["name"] == "AskUserQuestion":
                        asked_tool = True
        if e.get("type") == "user":
            if isinstance(content, list):
                for c in content:
                    if isinstance(c, dict) and c.get("type") == "tool_result":
                        results[c["tool_use_id"]] = text_len(c.get("content"))
            # a skill body is injected as a meta user message after the Skill tool call
            if e.get("isMeta") and any(m in json.dumps(content) for m in SKILL_MARKERS):
                skill_loaded_bytes += text_len(content)
    for uid, c in uses.items():
        blob = json.dumps(c.get("input", {}))
        if c["name"] == "Skill" or not any(m in blob for m in SKILL_MARKERS):
            continue
        path = c["input"].get("file_path") or c["input"].get("path") or c["input"].get("command", "")[:160]
        key = "%s %s" % (c["name"], path.split("/skills/", 1)[-1] if "/skills/" in path else path)
        skill_reads[key] = skill_reads.get(key, 0) + results.get(uid, 0)
    return {"tools": tools, "skills_invoked": skills_invoked, "asked_tool": asked_tool,
            "skill_reads": skill_reads, "skill_loaded_bytes": skill_loaded_bytes,
            "skill_bytes_read": sum(skill_reads.values()) + skill_loaded_bytes}


def diff_stat(wd):
    """Changes against the starter commit, so an agent that commits or branches is still counted."""
    sh(["git", "add", "-A"], cwd=wd)
    starter = sh(["git", "rev-list", "--max-parents=0", "--all"], cwd=wd).stdout.split()
    p = sh(["git", "diff", "--cached", "--numstat"] + starter[-1:], cwd=wd)
    files, added, removed = [], 0, 0
    for line in p.stdout.splitlines():
        a, r, f = line.split("\t", 2)
        files.append(f)
        added += int(a) if a.isdigit() else 0
        removed += int(r) if r.isdigit() else 0
    return {"files_changed": files, "lines_added": added, "lines_removed": removed}


def looks_like_question(text):
    tail = (text or "")[-1500:].lower()
    return ("?" in tail and any(w in tail for w in ("recommend", "which", "would you", "option", "mode")))


def turn_record(wall, out, ana):
    u = out.get("usage") or {}
    rec = {"wall_s": round(wall, 1), "duration_api_ms": out.get("duration_api_ms"),
           "num_turns": out.get("num_turns"), **{k: u.get(k, 0) or 0 for k in TOKEN_KEYS},
           "total_cost_usd": out.get("total_cost_usd", 0) or 0,
           "is_error": out.get("is_error"), "subtype": out.get("subtype"),
           "model_ids": sorted((out.get("modelUsage") or {}).keys()),
           "model_usage": out.get("modelUsage") or {},
           "permission_denials": [d.get("tool_name", "") + " " + json.dumps(d.get("tool_input", {}))[:160]
                                  for d in (out.get("permission_denials") or [])],
           "session_id": out.get("session_id"), "result_tail": (out.get("result") or "")[-600:], **ana}
    rec["tokens_total"] = sum(rec[k] for k in TOKEN_KEYS)
    return rec


def prompts_for(task, condition, mode):
    base = open(os.path.join(TASKS_DIR, task, "prompt.md")).read().strip()
    suffix = (" " + ASSUME_SUFFIX) if mode == "scored" else ""
    fu_path = os.path.join(TASKS_DIR, task, "followups.json")
    fus = json.load(open(fu_path)) if (mode == "scored" and os.path.exists(fu_path)) else []
    slash = SLASH.get(condition, "")
    if condition == "fastfix" and fus:          # the follow-ups are the small edits
        return [base + suffix] + [slash + f + suffix for f in fus]
    return [slash + base + suffix] + [f + suffix for f in fus]


def run_one(job, work, args, write_cb):
    task, condition, version, model, rep, mode, order = (job[k] for k in
                                                         ("task", "condition", "version", "model", "rep", "mode", "order"))
    head = {"task": task, "condition": condition, "version": version, "model": model, "rep": rep,
            "mode": mode, "order": order}
    with lock:
        if spent[0] >= args.budget:
            return {**head, "skipped": "budget"}
    mshort = (model or "default").replace("claude-", "")
    base = os.path.join(work, mshort, version.strip("-") or "na", condition, task, "%s-r%d" % (mode, rep))
    wd, cfg = os.path.join(base, "w"), os.path.join(base, "cfg")
    shutil.rmtree(base, ignore_errors=True)
    make_workdir(task, wd)
    make_config(cfg, condition, skills_source(version, work, args.before_ref))
    max_turns = PROBE_TURNS if mode == "probe" else args.max_turns
    started = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    turns, seen, sid = [], set(), None
    for i, p in enumerate(prompts_for(task, condition, mode)):
        wall, out = claude(p, wd, cfg, resume=sid, max_turns=max_turns, max_budget=args.run_budget, model=model)
        sid = out.get("session_id") or sid
        rec = turn_record(wall, out, analyse(transcript_events(cfg), seen))
        # On a resumed session, total_cost_usd and duration_api_ms are cumulative over the
        # session while usage and num_turns are per call: keep the per-call delta.
        if turns:
            rec["total_cost_usd"] -= sum(t["total_cost_usd"] for t in turns)
            rec["duration_api_ms"] = (rec["duration_api_ms"] or 0) - sum(t["duration_api_ms"] or 0 for t in turns)
        rec["prompt"] = p
        turns.append(rec)
        with lock:
            spent[0] += rec["total_cost_usd"]
        print("  #%-3d %-6s %-6s %-9s %-13s r%d turn %d: %6.1fs  $%.3f  tok %7d  skillKB %5.1f  (spent $%.2f)" % (
            order, mshort[:6], version, condition, task, rep, i + 1, wall, rec["total_cost_usd"],
            rec["tokens_total"], rec["skill_bytes_read"] / 1024, spent[0]), flush=True)
        if rec.get("is_error") and not out.get("session_id"):
            break
    diff = diff_stat(wd)
    asked = any(t["asked_tool"] for t in turns) or looks_like_question(turns[0]["result_tail"])
    total = {k: sum((t.get(k) or 0) for t in turns) for k in
             ("wall_s", "duration_api_ms", "num_turns", *TOKEN_KEYS, "tokens_total", "total_cost_usd",
              "skill_bytes_read")}
    total["wall_s"] = round(total["wall_s"], 1)
    reads = {}
    for t in turns:
        for k, v in t["skill_reads"].items():
            reads[k] = reads.get(k, 0) + v
    rec = {**head, "started_at": started, "claude_version": args.cli_version,
           "model_ids": sorted({m for t in turns for m in t["model_ids"]}),
           "workdir": wd, "config": cfg, "max_turns": max_turns, "run_budget_usd": args.run_budget, **total,
           "asked": asked, "stalled_on_question": asked and not diff["files_changed"],
           "skills_invoked": sum((t["skills_invoked"] for t in turns), []),
           "permission_denials": sum((t["permission_denials"] for t in turns), []),
           "skill_reads": reads, **diff, "turns": turns, "final_result_tail": turns[-1]["result_tail"]}
    write_cb(rec)
    return rec


def build_jobs(a):
    """One dict per run, in launch order: round k holds every cell's repeat k, shuffled."""
    cells = []          # (model, condition, version, repeat)
    if a.plan == "full":
        for model, spec in FULL_PLAN.items():
            for cond, ver in spec["cells"]:
                cells.append((model, cond, ver, spec["repeat"]))
    else:
        for model in (a.models.split(",") if a.models else [a.model]):
            for cond in a.conditions.split(","):
                cond = ALIASES.get(cond, cond)
                for ver in (["-"] if cond == "none" else a.versions.split(",")):
                    cells.append((model, cond, ver, a.repeat))
    tasks = a.tasks.split(",")
    modes = ([] if a.no_scored else ["scored"]) + (["probe"] if a.probe else [])
    rng = random.Random(a.seed)
    jobs, rounds = [], max(c[3] for c in cells)
    for r in range(rounds):
        rnd = []
        for (model, cond, ver, rep) in cells:
            if r >= rep:
                continue
            for t in tasks:
                if cond == "fastfix" and t not in SMALL_TASKS:
                    continue
                for mode in modes:
                    rnd.append({"task": t, "condition": cond, "version": ver, "model": model, "rep": r, "mode": mode})
        rng.shuffle(rnd)
        jobs += rnd
    for i, j in enumerate(jobs):
        j["order"] = i
    return jobs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", choices=["full"], default=None, help="the AFTER matrix in FULL_PLAN")
    ap.add_argument("--tasks", default=",".join(TASKS))
    ap.add_argument("--conditions", default=",".join(CONDITIONS))
    ap.add_argument("--versions", default="after", help="before,after (none always runs once, as '-')")
    ap.add_argument("--before-ref", default="origin/main", help="git ref whose skills/ is the `before` version")
    ap.add_argument("--probe", action="store_true", help="also run the bare prompt to see if it asks")
    ap.add_argument("--no-scored", action="store_true", help="skip the scored runs (probe only)")
    ap.add_argument("--repeat", type=int, default=1)
    ap.add_argument("--seed", type=int, default=20261014, help="shuffle seed for the launch order")
    ap.add_argument("--jobs", type=int, default=3)
    ap.add_argument("--budget", type=float, default=40.0, help="stop launching runs past this total USD")
    ap.add_argument("--run-budget", type=float, default=8.0, help="--max-budget-usd per claude call")
    ap.add_argument("--max-turns", type=int, default=None)
    ap.add_argument("--model", default=None, help="one model; default: the CLI's own default")
    ap.add_argument("--models", default=None, help="several models, comma-separated")
    ap.add_argument("--work", default=os.environ.get("KZ_BENCH_WORK", "/tmp/kzb"))
    ap.add_argument("--label", default="run")
    ap.add_argument("--out", default=None)
    ap.add_argument("--dry-run", action="store_true", help="print the launch order and stop")
    ap.add_argument("--no-score", action="store_true")
    a = ap.parse_args()
    a.cli_version = sh(["claude", "--version"]).stdout.strip()
    stamp = datetime.date.today().isoformat()
    jobs = build_jobs(a)
    if a.dry_run:
        for j in jobs:
            print("%(order)4d %(model)s %(version)s %(condition)s %(task)s r%(rep)d %(mode)s" % j)
        print("%d runs" % len(jobs))
        return 0
    work = os.path.join(a.work, "%s-%s-%s" % (a.label, stamp, datetime.datetime.now().strftime("%H%M%S")))
    os.makedirs(work, exist_ok=True)
    out = a.out or os.path.join(RESULTS_DIR, "%s-%s.json" % (a.label, stamp))
    prev = json.load(open(out)) if os.path.exists(out) else {}   # merge with an earlier file of the same name
    before_sha = sh(["git", "rev-parse", a.before_ref], cwd=REPO).stdout.strip()
    after_sha = sh(["git", "rev-parse", "HEAD"], cwd=REPO).stdout.strip()
    dirty = bool(sh(["git", "status", "--porcelain", "skills"], cwd=REPO).stdout.strip())
    doc = {"label": a.label, "date": stamp, "claude_version": a.cli_version, "assume_suffix": ASSUME_SUFFIX,
           "probe_max_turns": PROBE_TURNS, "max_turns": a.max_turns, "plan": a.plan or "custom",
           "plan_spec": FULL_PLAN if a.plan == "full" else None, "seed": a.seed, "jobs_parallel": a.jobs,
           "permission_mode": "acceptEdits", "allowed_tools": CHILD_TOOLS,
           "versions": {"before": "%s (%s)" % (a.before_ref, before_sha[:10]),
                        "after": "working tree at %s%s" % (after_sha[:10], " + uncommitted skills/ edits" if dirty else "")},
           "launch_order": ["%(model)s|%(version)s|%(condition)s|%(task)s|r%(rep)d|%(mode)s" % j for j in jobs],
           "work": work, "runs": list(prev.get("runs", []))}
    base_cost = prev.get("total_cost_usd", 0)
    print("work dir: %s  (%d runs, %d at a time, seed %d)" % (work, len(jobs), a.jobs, a.seed), flush=True)

    def write(rec):
        with lock:
            doc["runs"].append(rec)
            doc["total_cost_usd"] = round(base_cost + spent[0], 4)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out + ".tmp", "w") as f:
                json.dump(doc, f, indent=1)
            os.replace(out + ".tmp", out)

    with cf.ThreadPoolExecutor(max_workers=a.jobs) as ex:
        futs = [ex.submit(run_one, j, work, a, write) for j in jobs]
        for f in cf.as_completed(futs):
            try:
                r = f.result()
                if r.get("skipped"):
                    write(r)
            except Exception as e:                       # keep the other runs
                write({"error": repr(e)})
    doc["runs"].sort(key=lambda r: (r.get("model") or "", r.get("mode", ""), r.get("task", ""),
                                    r.get("condition", ""), r.get("version", ""), r.get("rep", 0)))
    write_final = dict(doc, total_cost_usd=round(base_cost + spent[0], 4))
    with open(out, "w") as f:
        json.dump(write_final, f, indent=1)
    print("wrote %s  total $%.2f" % (out, write_final["total_cost_usd"]))
    if not a.no_score:
        subprocess.run(["node", os.path.join(HERE, "score.mjs"), out])


if __name__ == "__main__":
    sys.exit(main())
