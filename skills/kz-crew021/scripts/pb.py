#!/usr/bin/env python3
"""pb — the zero-token half of the crew-project workflow.

Ready queue, the six dispatch checks, write-set locks, done-when verification,
ledger, velocity, re-queue on a changed decision, phase gate, session report.
No model is called from here.

    python pb.py init --phase pre-production --budget 400000
    python pb.py owners set "app/**" FE-Felix
    python pb.py musts F-001 F-004
    python pb.py add T-07 --title "FE skeleton" --assignee FE-Felix --tier low \\
        --size M --writes "app/**" "components/**" --needs T-02 D-003 \\
        --reads Index.md contracts/auth.yaml --feature F-004 \\
        --done-when "npm test"
    python pb.py ready
    python pb.py dispatch T-07
    python pb.py start T-07
    python pb.py verify T-07
    python pb.py done T-07 --actual 41000
    python pb.py decide D-003 --answer "JWT, 15min access token"
    python pb.py requeue D-003
    python pb.py gate
    python pb.py report
    python pb.py selfcheck

State lives in .pb/ at the main repo root — NOT inside an agent worktree, since
the locks, ledger and velocity are shared across every lane. Point at it with
PB_ROOT when running from a worktree. Commit .pb/: the ledger is the only
memory this workflow has between sessions.
"""
import argparse
import fnmatch
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.environ.get("PB_ROOT", ".")


def _paths():
    d = os.path.join(ROOT, ".pb")
    return (d,
            os.path.join(d, "tasks.json"),
            os.path.join(d, "budget", "ledger.jsonl"),
            os.path.join(d, "budget", "velocity.json"),
            os.path.join(d, "config.json"))


DIR, TASKS, LEDGER, VELOCITY, CONFIG = _paths()

POINTS = {"S": 1, "M": 3, "L": 8, "XL": 20}
TIERS = ("low", "frontier")          # two tiers. There is no "mid".
DEFAULT_VELOCITY = 12000.0           # tokens/point, until the ledger knows better
PLAN_BUFFER = 1.2                    # phase planning headroom (06-budget.md)
DISPATCH_BUFFER = 1.3                # the ONLY buffer applied at the gate
INPUT_SHARE = 0.5                    # of est tokens, assumed to be input
PACK_CEILING = 0.6                   # pack may not exceed this share of est_in

# phase -> (max retries, verify mode)
PHASES = {
    "initialize":     (0, "none"),
    "poc":            (1, "script"),
    "pre-production": (0, "script"),
    "production":     (1, "script+review"),
    "maintenance":    (1, "regression"),
}

# Seeded at init so check 1 is a real gate on day one, not an empty map that
# passes vacuously. Override with `pb.py owners set`.
DEFAULT_OWNERS = {
    "contracts/**": "SA-Silas",
    "app/**": "FE-Felix",
    "components/**": "FE-Felix",
    "api/**": "BE-Bruno",
    "server/**": "BE-Bruno",
    "db/**": "DB-Dana",
    ".github/**": "DO-Dominic",
    "tests/**": "QA-Quinn",
    "ops/**": "SR-Sam",
    "updates/**": "*",               # every agent appends to its own file
}

SECRET_PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key id"),
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"), "private key"),
    (re.compile(r"\bsk-[A-Za-z0-9]{20,}"), "API secret key"),
    (re.compile(r"(?i)\b(password|secret|api_key)\s*[=:]\s*['\"][^'\"]{6,}"), "hardcoded credential"),
]


# ---------------------------------------------------------------- storage

def _read(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def _write(path, data):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load_tasks():
    return _read(TASKS, [])


def save_tasks(tasks):
    _write(TASKS, tasks)


def config():
    return _read(CONFIG, {"phase": "initialize", "wip_cap": 5, "budget": 0,
                          "decisions": {}, "owners": {}, "must_features": []})


def save_config(cfg):
    _write(CONFIG, cfg)


def find(tasks, tid):
    for t in tasks:
        if t["id"] == tid:
            return t
    raise SystemExit("no such task: " + tid)


# ---------------------------------------------------------------- velocity

def velocity():
    v = _read(VELOCITY, {})
    return v.get("tokens_per_point", DEFAULT_VELOCITY), v.get("samples", 0)


def estimate(task):
    """Plain expectation: points x velocity. No buffer.

    The buffer belongs at the gate, not in the ledger — an est that has been
    padded makes every est-vs-actual comparison lie, and that comparison is the
    only thing that re-sizes the DAG.
    """
    tpp, _ = velocity()
    return int(POINTS[task["size"]] * tpp)


def record(task, actual):
    """Append one immutable ledger line and roll velocity forward."""
    line = {
        "task": task["id"],
        "points": POINTS[task["size"]],
        "est": task.get("est", 0),      # frozen at plan time (rule 10)
        "actual": actual,
        "assignee": task.get("assignee"),
        "tier": task.get("tier"),
        "attempts": task.get("attempts", 1),
        "rework_for": task.get("rework_for"),
        "pack_tokens": task.get("pack_tokens"),
        "ts": int(time.time()),
    }
    os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
    with open(LEDGER, "a", encoding="utf-8") as f:
        f.write(json.dumps(line) + "\n")

    # Rework caused by a changed decision is waste, not throughput. Folding it
    # into velocity would inflate every future estimate.
    if not line["rework_for"]:
        tpp, n = velocity()
        tpp = (tpp * n + actual / line["points"]) / (n + 1)
        _write(VELOCITY, {"tokens_per_point": round(tpp, 1), "samples": n + 1})
    return line


def ledger():
    try:
        with open(LEDGER, encoding="utf-8") as f:
            return [json.loads(l) for l in f if l.strip()]
    except FileNotFoundError:
        return []


def remaining_budget():
    cfg = config()
    if not cfg.get("budget"):
        return None
    return cfg["budget"] - sum(l["actual"] for l in ledger())


# ---------------------------------------------------------------- context pack

def pack_tokens(task):
    """Measured size of the context pack, in tokens. Lever #1 in 06-budget.md.

    ponytail: bytes/4 is the standard rough token ratio; swap for a real
    tokenizer if pack trimming ever gets fought over.
    """
    total, missing = 0, []
    for ref in task.get("reads", []):
        p = os.path.join(ROOT, ref)
        try:
            total += os.path.getsize(p) // 4
        except OSError:
            missing.append(ref)
    return total, missing


def est_in(task):
    return max(1, int(task.get("est", 0) * INPUT_SHARE))


# ---------------------------------------------------------------- queue

def score(task, tasks):
    s = {"Must": 3, "Good": 1, "Nice": 0}.get(task.get("mustness", "Nice"), 0)
    if task.get("critical_path"):
        s += 3
    s += 2 * sum(1 for t in tasks if task["id"] in t.get("needs", []))
    if task.get("risk") == "high":
        s += 1
    if task.get("assumed"):
        s -= 2
    return s


def ready(tasks):
    done = {t["id"] for t in tasks if t["status"] == "merged"}
    answered = set(config().get("decisions", {}))
    out = []
    for t in tasks:
        if t["status"] != "queued":
            continue
        deps = t.get("needs", [])
        if all((d in done if d.startswith("T-") else d in answered) for d in deps):
            out.append(t)
    return sorted(out, key=lambda t: -score(t, tasks))


def locked_paths(tasks):
    held = {}
    for t in tasks:
        if t["status"] == "in-flight":
            for g in t.get("writes", []):
                held[g] = t["id"]
    return held


def overlaps(a, b):
    """Two globs conflict if either could match a path under the other.

    ponytail: prefix comparison, swap for a plan-time path-set intersection if
    globs get clever (braces, mid-pattern wildcards).
    """
    pa = a.split("*")[0].rstrip("/")
    pb = b.split("*")[0].rstrip("/")
    return pa == pb or pa.startswith(pb + "/") or pb.startswith(pa + "/") \
        or fnmatch.fnmatch(pa, b) or fnmatch.fnmatch(pb, a)


def owner_of(glob, owners):
    for pattern, who in owners.items():
        if pattern == glob or overlaps(glob, pattern):
            return who
    return None


# ---------------------------------------------------------------- 6 checks

def dispatch_checks(task, tasks, remaining):
    """The six gates. Returns (ok, [(name, ok, detail)])."""
    cfg = config()
    results = []

    owners = cfg.get("owners", {})
    if not owners:
        results.append(("1 owner glob", False,
                        "ownership map is empty — run `pb.py owners set`"))
    else:
        bad = []
        for g in task.get("writes", []):
            who = owner_of(g, owners)
            if who not in (None, "*", task.get("assignee")):
                bad.append("%s is %s's" % (g, who))
        results.append(("1 owner glob", not bad, "; ".join(bad) or "ok"))

    held = locked_paths(tasks)
    clash = [(g, h) for g in task.get("writes", []) for h in held
             if overlaps(g, h) and held[h] != task["id"]]
    results.append(("2 write-set lock", not clash,
                    "; ".join("%s held by %s" % (g, held[h]) for g, h in clash)
                    or "ok"))

    inflight = sum(1 for t in tasks if t["status"] == "in-flight")
    cap = cfg.get("wip_cap", 5)
    results.append(("3 WIP cap", inflight < cap, "%d/%d in flight" % (inflight, cap)))

    want = "frontier" if task.get("attempts", 0) > 0 else task.get("tier")
    tier_ok = task.get("tier") in TIERS and task.get("tier") == want
    results.append(("4 tier", tier_ok,
                    "attempt %d needs %s, task is %s"
                    % (task.get("attempts", 0), want, task.get("tier"))))

    pack, missing = pack_tokens(task)
    ceiling = int(est_in(task) * PACK_CEILING)
    if missing:
        pack_ok, detail = False, "missing refs: " + ", ".join(missing)
    elif not task.get("reads") and task.get("needs"):
        pack_ok, detail = False, "no reads declared but the task has deps"
    elif pack > ceiling:
        pack_ok, detail = False, ("pack %dk > %d%% of est_in (%dk) — trim to "
                                  "Index + direct deps"
                                  % (pack / 1000, PACK_CEILING * 100, ceiling / 1000))
    else:
        pack_ok, detail = True, "%d refs · %dk tok (ceiling %dk)" % (
            len(task.get("reads", [])), pack / 1000, ceiling / 1000)
    results.append(("5 context pack", pack_ok, detail))

    est = task.get("est", 0)
    need = int(est * DISPATCH_BUFFER)
    if remaining is None:
        gate_ok, detail = True, "no budget tracked"
    elif need <= remaining:
        gate_ok, detail = True, "need %dk ≤ remaining %dk" % (need / 1000, remaining / 1000)
    elif est <= remaining:
        gate_ok, detail = True, ("AMBER · est %dk fits %dk remaining but the 1.3 "
                                 "buffer does not" % (est / 1000, remaining / 1000))
    else:
        gate_ok, detail = False, ("est %dk > remaining %dk — drop a tier, trim the "
                                  "pack, Musts only, then Ask Card"
                                  % (est / 1000, remaining / 1000))
    results.append(("6 budget gate", gate_ok, detail))

    return all(r[1] for r in results), results


# ---------------------------------------------------------------- verify

def iter_owned_files(globs):
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in (".git", ".pb", "node_modules", "__pycache__")]
        for f in files:
            rel = os.path.relpath(os.path.join(base, f), ROOT).replace(os.sep, "/")
            if any(fnmatch.fnmatch(rel, g) or rel.startswith(g.split("*")[0])
                   for g in globs):
                yield os.path.join(base, f)


def scan_secrets(globs):
    """Always-on, costs nothing, catches the thing SE-Sera won't see until
    Production."""
    hits = []
    for path in iter_owned_files(globs):
        try:
            if os.path.getsize(path) > 1_000_000:
                continue
            with open(path, encoding="utf-8", errors="ignore") as f:
                text = f.read()
        except OSError:
            continue
        for pattern, label in SECRET_PATTERNS:
            if pattern.search(text):
                hits.append("%s: %s" % (os.path.relpath(path, ROOT), label))
    return hits


def run_done_when(task):
    cmd = task.get("done_when", "").strip()
    if not cmd:
        return None, "no done_when declared"
    try:
        p = subprocess.run(cmd, shell=True, cwd=ROOT, capture_output=True,
                           text=True, timeout=1800)
    except subprocess.TimeoutExpired:
        return False, "done_when timed out after 30m"
    tail = (p.stdout + p.stderr).strip().splitlines()[-3:]
    return p.returncode == 0, "rc=%d %s" % (p.returncode, " | ".join(tail))


# ---------------------------------------------------------------- commands

def cmd_init(a):
    cfg = {"phase": a.phase, "wip_cap": a.wip_cap, "budget": a.budget,
           "decisions": {}, "owners": dict(DEFAULT_OWNERS), "must_features": []}
    save_config(cfg)
    if not os.path.exists(TASKS):
        save_tasks([])
    for d in ("updates", "contracts", "tasks"):
        os.makedirs(os.path.join(ROOT, d), exist_ok=True)
    print("initialised %s · phase %s · budget %s · wip cap %d"
          % (DIR, a.phase, a.budget or "untracked", a.wip_cap))
    print("owners seeded with %d default globs — `pb.py owners list` to check"
          % len(DEFAULT_OWNERS))
    print("keep .pb/ at the main repo root and commit it; worktrees point at it "
          "with PB_ROOT")


def cmd_owners(a):
    cfg = config()
    if a.action == "list":
        for g, who in sorted(cfg.get("owners", {}).items()):
            print("%-24s %s" % (g, who))
        return
    if a.action == "set":
        if not (a.glob and a.agent):
            raise SystemExit("usage: pb.py owners set <glob> <agent>")
        cfg.setdefault("owners", {})[a.glob] = a.agent
        save_config(cfg)
        print("%s → %s" % (a.glob, a.agent))
        return
    if a.action == "import":
        added = 0
        with open(a.glob, encoding="utf-8") as f:
            for line in f:
                line = line.split("#")[0].strip()
                if not line:
                    continue
                parts = line.split()
                if len(parts) != 2:
                    raise SystemExit("bad line (want `<glob> <agent>`): " + line)
                cfg.setdefault("owners", {})[parts[0]] = parts[1]
                added += 1
        save_config(cfg)
        print("imported %d globs from %s" % (added, a.glob))


def cmd_musts(a):
    cfg = config()
    cfg["must_features"] = a.features
    save_config(cfg)
    if len(a.features) > 7:
        print("WARNING: %d Must features — the cap is 7 (01-lifecycle.md)"
              % len(a.features))
    print("MVP frozen at %d Must features: %s" % (len(a.features), ", ".join(a.features)))


def cmd_add(a):
    tasks = load_tasks()
    if any(t["id"] == a.id for t in tasks):
        raise SystemExit("duplicate task id: " + a.id)
    task = {
        "id": a.id, "title": a.title, "assignee": a.assignee, "tier": a.tier,
        "feature": a.feature, "mustness": a.mustness, "size": a.size,
        "reads": a.reads, "writes": a.writes, "needs": a.needs,
        "done_when": a.done_when, "status": "queued", "attempts": 0,
        "verified": None, "reviewed": [], "rework_for": None,
        "critical_path": a.critical_path, "risk": a.risk, "assumed": a.assumed,
    }
    task["est"] = estimate(task)     # frozen here, never recomputed
    tasks.append(task)
    save_tasks(tasks)
    print("%s · %s pts · est %dk tok" % (a.id, POINTS[a.size], task["est"] / 1000))
    if not a.done_when:
        print("  no --done-when: this task cannot be script-verified")


def cmd_ready(a):
    tasks = load_tasks()
    q = ready(tasks)
    if not q:
        print("nothing ready")
        return
    for t in q:
        print("%-6s %-28s %-12s %2s pts  score %2d  est %5dk%s"
              % (t["id"], t["title"][:28], t["assignee"], POINTS[t["size"]],
                 score(t, tasks), t["est"] / 1000,
                 "  rework:" + t["rework_for"] if t.get("rework_for") else ""))


def cmd_dispatch(a):
    tasks = load_tasks()
    task = find(tasks, a.task)
    remaining = a.remaining if a.remaining is not None else remaining_budget()
    ok, results = dispatch_checks(task, tasks, remaining)
    for name, good, detail in results:
        print("%s %-18s %s" % ("PASS" if good else "HOLD", name, detail))
    print("\n%s %s" % ("DISPATCH" if ok else "HOLD", task["id"]))
    sys.exit(0 if ok else 1)


def cmd_start(a):
    tasks = load_tasks()
    t = find(tasks, a.task)
    t["status"] = "in-flight"
    t["attempts"] = t.get("attempts", 0) + 1
    t["verified"] = None
    pack, _ = pack_tokens(t)
    t["pack_tokens"] = pack
    save_tasks(tasks)
    print("%s in flight · attempt %d · %s · pack %dk"
          % (t["id"], t["attempts"], t["tier"], pack / 1000))


def cmd_verify(a):
    tasks = load_tasks()
    t = find(tasks, a.task)
    mode = PHASES[config()["phase"]][1]

    secrets = scan_secrets(t.get("writes", []))
    for s in secrets:
        print("FAIL secrets           " + s)

    if mode == "none":
        passed, detail = True, "phase has no verify step"
    else:
        passed, detail = run_done_when(t)
        if passed is None:
            passed, detail = False, detail
    print("%s done_when         %s" % ("PASS" if passed else "FAIL", detail))

    t["verified"] = bool(passed) and not secrets
    save_tasks(tasks)
    if mode == "script+review" and t["verified"]:
        print("\nphase needs review too: pass --reviewed QA-Quinn CR-Cyrus to `done`")
    sys.exit(0 if t["verified"] else 1)


def cmd_done(a):
    tasks = load_tasks()
    t = find(tasks, a.task)
    mode = PHASES[config()["phase"]][1]

    if mode != "none" and not t.get("verified") and not a.force:
        raise SystemExit("%s is not verified — run `pb.py verify %s` first "
                         "(or --force and say so in the session report)"
                         % (t["id"], t["id"]))
    if mode == "script+review" and not a.reviewed and not a.force:
        raise SystemExit("%s: phase %s needs --reviewed (QA-Quinn CR-Cyrus)"
                         % (t["id"], config()["phase"]))

    t["status"] = "merged"
    t["reviewed"] = a.reviewed
    line = record(t, a.actual)
    t["rework_for"] = None      # this rework is paid for; future runs count again
    save_tasks(tasks)

    drift = (a.actual - t["est"]) / t["est"] * 100 if t["est"] else 0
    print("%s merged · est %dk actual %dk (%+.0f%%)"
          % (t["id"], t["est"] / 1000, a.actual / 1000, drift))
    if abs(drift) > 100:
        print("  ▲ over 2× est — the SIZE was wrong, re-size its siblings")
    if line["rework_for"]:
        print("  rework for %s — excluded from velocity" % line["rework_for"])
    unlocked = [x["id"] for x in ready(tasks) if a.task in x.get("needs", [])]
    if unlocked:
        print("  unlocked: " + ", ".join(unlocked))


def cmd_fail(a):
    tasks = load_tasks()
    t = find(tasks, a.task)
    retries, _ = PHASES[config()["phase"]]
    if t["attempts"] >= retries + 1:
        t["status"] = "abandoned"
        print("%s abandoned · phase %s allows %d attempt(s)"
              % (t["id"], config()["phase"], retries + 1))
        if t.get("mustness") == "Must":
            print("  ▲ this is a Must — the phase gate will fail until it is "
                  "rebuilt or descoped by a D-id")
    else:
        t["status"] = "queued"
        t["tier"] = "frontier"          # escalation is one-way, on retry only
        t["verified"] = None
        print("%s re-queued at frontier (attempt %d next)"
              % (t["id"], t["attempts"] + 1))
    save_tasks(tasks)


def cmd_decide(a):
    cfg = config()
    cfg.setdefault("decisions", {})[a.decision] = a.answer
    save_config(cfg)
    print("%s = %s" % (a.decision, a.answer))
    print("  this unblocks the queue only. The decision's record of truth is "
          "Decisions.md — append it via updates/ so TW-Tessa writes it.")


def cmd_requeue(a):
    tasks = load_tasks()
    hit = [t for t in tasks if a.decision in t.get("needs", [])]
    for t in hit:
        t["status"] = "queued"
        t["rework_for"] = a.decision
        t["attempts"] = 0       # rework is not a failed attempt: no escalation
        t["verified"] = None
    save_tasks(tasks)
    print("%s changed → re-queued %d task(s): %s"
          % (a.decision, len(hit), ", ".join(t["id"] for t in hit) or "none"))


# ---------------------------------------------------------------- loop-fix

# The loop nests: A1 and A2 trade exchanges until the critic accepts, THEN the
# gate rules. A FALSE ruling drops back into another A1/A2 inner loop. An outer
# cycle is one inner loop plus one ruling; neither loop has a fixed length.
STALL_CYCLES = 3        # same finding across this many outer cycles = stalled
INNER_WARN = 6          # exchanges in one inner loop before it looks like circling


def loop_path(task):
    return os.path.join(DIR, "loops", task + ".json")


def load_loop(task):
    loop = _read(loop_path(task), None)
    if loop is None:
        raise SystemExit("no open loop for %s — run `pb.py loop open %s`" % (task, task))
    return loop


def loop_next(loop):
    """Who speaks next. None means the gate ruled TRUE and the loop can close.

    critic reject → fixer      (inner loop continues)
    fixer  either → critic     (every fix gets re-reviewed; a fixer that could
                               not reproduce hands back for a repro)
    critic accept → gate       (inner loop done, A1 and A2 agree)
    gate   reject → critic     (drop back into a fresh inner loop)
    gate   accept → None       (all three agree)
    """
    ex = loop["exchanges"]
    if not ex:
        return "critic"
    last = ex[-1]
    if last["agent"] == "critic":
        return "gate" if last["verdict"] == "accept" else "fixer"
    if last["agent"] == "fixer":
        return "critic"
    return None if last["verdict"] == "accept" else "critic"


def loop_cycle(loop):
    """Current outer cycle number — incremented by each FALSE ruling."""
    return 1 + sum(1 for e in loop["exchanges"]
                   if e["agent"] == "gate" and e["verdict"] == "reject")


def loop_inner(loop):
    """Exchanges in the current inner loop (since the last gate ruling)."""
    n = 0
    for e in reversed(loop["exchanges"]):
        if e["agent"] == "gate":
            break
        n += 1
    return n


def loop_stalled(loop):
    """The same finding across three outer cycles means nobody is learning."""
    by_cycle = {}
    for e in loop["exchanges"]:
        texts = by_cycle.setdefault(e["cycle"], set())
        texts |= {f.strip().lower() for f in e["findings"]}
    cycles = [by_cycle[c] for c in sorted(by_cycle)][-STALL_CYCLES:]
    if len(cycles) < STALL_CYCLES or not all(cycles):
        return None
    return sorted(set.intersection(*cycles)) or None


def cmd_loop(a):
    if a.action == "open":
        if not a.scope:
            raise SystemExit("--scope is required: name the ONE thing being fixed")
        _write(loop_path(a.task), {"task": a.task, "scope": a.scope,
                                   "opened": int(time.time()), "exchanges": [],
                                   "status": "open", "tokens": 0})
        print("loop open on %s · scope: %s" % (a.task, a.scope))
        print("inner: critic ↔ fixer until the critic accepts · then the gate rules")
        print("a FALSE ruling starts another inner loop · next: critic")
        return

    loop = load_loop(a.task)

    if a.action == "round":
        if loop["status"] != "open":
            raise SystemExit("loop on %s is %s" % (a.task, loop["status"]))
        if not a.evidence:
            raise SystemExit("--evidence is mandatory: a command run, a file and "
                             "line read, or a failure reproduced. A verdict "
                             "without evidence is void.")
        expected = loop_next(loop)
        if expected is None:
            raise SystemExit("the gate already ruled TRUE — close the loop")
        if a.agent != expected:
            raise SystemExit("expected %s next, got %s" % (expected, a.agent))

        cycle = loop_cycle(loop)
        loop["exchanges"].append({"agent": a.agent, "verdict": a.verdict,
                                  "findings": a.findings, "evidence": a.evidence,
                                  "cycle": cycle, "ts": int(time.time())})
        _write(loop_path(a.task), loop)

        print("cycle %d · exchange %d · %s: %s"
              % (cycle, sum(1 for e in loop["exchanges"] if e["cycle"] == cycle),
                 a.agent, a.verdict))
        nxt = loop_next(loop)
        if a.agent == "fixer" and a.verdict == "reject":
            print("  fixer could not reproduce — the critic produces a repro or withdraws")
        if a.agent == "critic" and a.verdict == "accept":
            print("  A1 and A2 agree — the gate rules on whether that is TRUE")
        if a.agent == "gate" and a.verdict == "reject":
            print("  GATE RULED FALSE — cycle %d starts, back to the critic with"
                  " what is wrong" % (cycle + 1))
        if nxt is None:
            print("  all three agree — `pb.py loop close %s --tokens N`" % a.task)
        else:
            print("  next: " + nxt)

        inner = loop_inner(loop)
        if inner >= INNER_WARN and nxt in ("critic", "fixer"):
            print("  ▲ %d exchanges in this inner loop — A1 and A2 are circling."
                  " Escalate the fixer, or hand back: the defect may be"
                  " under-specified." % inner)
        rejects = sum(1 for e in loop["exchanges"]
                      if e["agent"] == "fixer" and e["verdict"] == "reject")
        if rejects >= 2:
            print("  fixer rejected twice — escalate the fixer to frontier")
        return

    if a.action == "status":
        print("%s · %s · scope: %s" % (a.task, loop["status"], loop["scope"]))
        print("cycle %d · %d exchange(s) in this inner loop · %d total · %dk tokens"
              % (loop_cycle(loop), loop_inner(loop), len(loop["exchanges"]),
                 loop["tokens"] / 1000))
        for e in loop["exchanges"]:
            print("  c%d %-7s %-7s %s" % (e["cycle"], e["agent"], e["verdict"],
                                          e["evidence"][:58]))
        nxt = loop_next(loop)
        print("  waiting on: " + (nxt or "nothing — all three agree, close it"))
        stalled = loop_stalled(loop)
        if stalled:
            print("\nSTALLED — the same finding across %d cycles: %s"
                  % (STALL_CYCLES, "; ".join(stalled)))
            print("Hand back to the orchestrator. Repeated rounds are ritual now;")
            print("this is usually an under-specified requirement, i.e. a D-id.")
        rem = remaining_budget()
        if rem is not None and loop["tokens"] > rem * 0.5:
            print("\nBUDGET — this loop has used %dk of %dk remaining. Check 6 "
                  "applies to loops too." % (loop["tokens"] / 1000, rem / 1000))
        return

    if a.action == "close":
        agreed = loop_next(loop) is None and loop["exchanges"]
        if not agreed and not a.abandon:
            raise SystemExit("the gate has not ruled TRUE — keep looping, or "
                             "`--abandon` and hand the transcript back")
        loop["status"] = "agreed" if agreed else "abandoned"
        loop["tokens"] += a.tokens
        _write(loop_path(a.task), loop)
        print("%s · %s after %d cycle(s), %d exchange(s) · %dk tokens"
              % (a.task, loop["status"], loop_cycle(loop),
                 len(loop["exchanges"]), loop["tokens"] / 1000))
        print("Record the cost on the task's ledger line with `pb.py done "
              "--actual`, and hand back to the orchestrator.")
        return


def cmd_gate(a):
    tasks, cfg = load_tasks(), config()
    spent = sum(l["actual"] for l in ledger())
    musts = cfg.get("must_features", [])
    open_ = [t for t in tasks if t["status"] in ("queued", "in-flight")]
    abandoned_musts = [t["id"] for t in tasks
                       if t["status"] == "abandoned" and t.get("mustness") == "Must"]
    built = {t["feature"] for t in tasks if t["status"] == "merged"}
    unbuilt = [f for f in musts if f not in built]

    checks = [
        ("Must count ≤ 7", len(musts) <= 7,
         "%d declared" % len(musts) if musts else "none declared — run `pb.py musts`"),
        ("no open tasks", not open_, ", ".join(t["id"] for t in open_) or "ok"),
        ("no abandoned Musts", not abandoned_musts,
         ", ".join(abandoned_musts) or "ok"),
        ("every Must built", not unbuilt,
         ", ".join(unbuilt) + " has no merged task" if unbuilt else "ok"),
        ("within budget", not cfg.get("budget") or spent <= cfg["budget"],
         "%dk of %dk" % (spent / 1000, cfg.get("budget", 0) / 1000)),
    ]
    for name, ok, detail in checks:
        print("%s %-20s %s" % ("PASS" if ok else "FAIL", name, detail))
    print("\nMechanical half only. The judgment half — is the Purpose clear, did")
    print("the preview review pass — is TL-Theo's, logged as a D-id.")
    sys.exit(0 if all(ok for _, ok, _ in checks) else 1)


def cmd_report(a):
    tasks, lines = load_tasks(), ledger()
    cfg = config()
    spent = sum(l["actual"] for l in lines)
    planned = sum(t["est"] for t in tasks)
    pts_done = sum(l["points"] for l in lines)
    pts_all = sum(POINTS[t["size"]] for t in tasks)
    tpp, n = velocity()
    rework = sum(l["actual"] for l in lines if l.get("rework_for"))
    retried = [l for l in lines if l.get("attempts", 1) > 1]
    packs = [l["pack_tokens"] for l in lines if l.get("pack_tokens")]

    print("SESSION · %s · %d tasks merged" % (cfg["phase"], len(lines)))
    print("spent     %dk tokens   vs %dk planned   %+.0f%%"
          % (spent / 1000, planned / 1000,
             (spent - planned) / planned * 100 if planned else 0))
    print("points    %d done / %d planned            %.0f%%"
          % (pts_done, pts_all, pts_done / pts_all * 100 if pts_all else 0))
    print("velocity  %.1fk / point  (%d samples)" % (tpp / 1000, n))

    print("\nWHERE IT WENT                tokens    %   vs est")
    by = {}
    for l in lines:
        act, est = by.get(l["assignee"] or "?", (0, 0))
        by[l["assignee"] or "?"] = (act + l["actual"], est + l["est"])
    for k, (act, est) in sorted(by.items(), key=lambda kv: -kv[1][0]):
        flag = "  ▲" if est and (act - est) / est > 0.3 else ""
        print("  %-22s %6dk %3.0f%%  %+4.0f%%%s"
              % (k, act / 1000, act / spent * 100 if spent else 0,
                 (act - est) / est * 100 if est else 0, flag))

    print("\nQUALITY BESIDE COST   (the guardrail — never read the block above alone)")
    print("  rework        %dk  %.0f%% of spend   (changed decisions, pure waste)"
          % (rework / 1000, rework / spent * 100 if spent else 0))
    print("  retried       %d task(s) needed a second attempt" % len(retried))
    if packs:
        print("  context pack  avg %dk in, %d measured" % (sum(packs) / len(packs) / 1000, len(packs)))
    print("  CR rejection  — track by hand; a falling token count with a rising")
    print("                  rejection rate is the loop eating the project")

    print("\nWHY IT VARIED — write this half yourself. A number without a cause")
    print("changes nothing next session. Then log ONE experiment in experiments.md.")



# ------------------------------------------------------------------- blocked

def cmd_block(a):
    """Mark a task blocked, and write the steps that clear it.

    A blocker reaches the human as instructions or it does not reach them at all.
    "blocked on credentials" is a status; the steps to produce the credentials are
    the deliverable, so --step is required and a single vague step is refused.
    """
    tasks = load_tasks()
    t = find(tasks, a.task)
    if not t:
        raise SystemExit("no such task: " + a.task)
    if len(a.step) < 2:
        raise SystemExit("a blocker needs at least two steps a human can follow; "
                         "one line restating the blocker is not instructions")
    t["status"] = "blocked"
    t["blocked"] = {"why": a.why, "owner": a.owner, "steps": a.step,
                    "since": time.strftime("%Y-%m-%d %H:%M")}
    save_tasks(tasks)
    print("%s blocked - %s - %d step(s) for %s"
          % (t["id"], a.why, len(a.step), a.owner))


def cmd_unblock(a):
    tasks = load_tasks()
    t = find(tasks, a.task)
    if not t:
        raise SystemExit("no such task: " + a.task)
    if t["status"] != "blocked":
        raise SystemExit("%s is %s, not blocked" % (t["id"], t["status"]))
    t["status"] = "queued"
    t.pop("blocked", None)
    save_tasks(tasks)
    print("%s unblocked - back in the ready queue" % t["id"])


# ----------------------------------------------------------------- dashboard

STATE_ORDER = ["blocked", "in-flight", "queued", "merged", "abandoned"]
STATE_LABEL = {"blocked": "blocked", "in-flight": "executing", "queued": "planned",
               "merged": "done", "abandoned": "dropped"}


def dashboard_data():
    """Everything the page draws, derived here so the page derives nothing."""
    tasks, lines, cfg = load_tasks(), ledger(), config()
    by_id = {l["task"]: l for l in lines if l.get("task")}

    def pct(done, all_):
        return round(done / all_ * 100) if all_ else 0

    sections = {}
    for t in tasks:
        f = t.get("feature") or "unassigned"
        sec = sections.setdefault(f, {"feature": f, "points": 0, "done": 0,
                                      "tasks": 0, "merged": 0, "blocked": 0})
        sec["points"] += POINTS[t["size"]]
        sec["tasks"] += 1
        if t["status"] == "merged":
            sec["done"] += POINTS[t["size"]]
            sec["merged"] += 1
        if t["status"] == "blocked":
            sec["blocked"] += 1
    for sec in sections.values():
        sec["pct"] = pct(sec["done"], sec["points"])

    rows = []
    for t in tasks:
        l = by_id.get(t["id"], {})
        rows.append({
            "id": t["id"], "title": t["title"], "feature": t.get("feature") or "-",
            "assignee": t.get("assignee") or "-", "tier": t.get("tier") or "-",
            "mustness": t.get("mustness") or "-", "points": POINTS[t["size"]],
            "state": STATE_LABEL.get(t["status"], t["status"]),
            "raw_state": t["status"],
            "est_k": round(t["est"] / 1000),
            "actual_k": round(l.get("actual", 0) / 1000),
            "attempts": t.get("attempts", 0),
            "assumed": bool(t.get("assumed")),
            "blocked": t.get("blocked"),
        })

    changelog = []
    for l in reversed(lines):
        changelog.append({
            "task": l.get("task", "?"), "title": l.get("title", ""),
            "who": l.get("assignee", "?"), "at": l.get("at", ""),
            "actual_k": round(l.get("actual", 0) / 1000),
            "rework_for": l.get("rework_for"),
            "attempts": l.get("attempts", 1),
        })

    all_pts = sum(POINTS[t["size"]] for t in tasks)
    done_pts = sum(POINTS[t["size"]] for t in tasks if t["status"] == "merged")
    spent = sum(l["actual"] for l in lines)
    return {
        "phase": cfg.get("phase", "?"),
        "generated": time.strftime("%Y-%m-%d %H:%M"),
        "overall": {"pct": pct(done_pts, all_pts), "done": done_pts, "points": all_pts,
                    "spent_k": round(spent / 1000),
                    "budget_k": round(cfg.get("budget", 0) / 1000)},
        "sections": sorted(sections.values(), key=lambda s: s["feature"]),
        "rows": rows,
        "blocked": [r for r in rows if r["raw_state"] == "blocked"],
        "changelog": changelog,
    }


def cmd_dashboard(a):
    """Write progress.html and run.bat. Regenerated, never hand-edited."""
    data = dashboard_data()
    out = os.path.join(ROOT, a.out)
    html = DASHBOARD_HTML.replace("__DATA__", json.dumps(data))
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)

    bat = os.path.join(ROOT, "run.bat")
    if not os.path.exists(bat) or a.force_bat:
        with open(bat, "w", encoding="utf-8") as f:
            f.write("@echo off\r\n"
                    "REM Regenerate the progress dashboard and open it.\r\n"
                    "python \"%~dp0scripts\\pb.py\" dashboard\r\n"
                    "start \"\" \"%~dp0progress.html\"\r\n")
    d = data["overall"]
    print("progress.html - %s - %d%% (%d/%d pts) - %dk spent%s"
          % (data["phase"], d["pct"], d["done"], d["points"], d["spent_k"],
             " - %d BLOCKED" % len(data["blocked"]) if data["blocked"] else ""))
    for b in data["blocked"]:
        print("  BLOCKED %s - %s - %d step(s) waiting on %s"
              % (b["id"], b["blocked"]["why"], len(b["blocked"]["steps"]),
                 b["blocked"]["owner"]))


DASHBOARD_HTML = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Project progress</title>
<style>
  /* This page is UI, so it follows the same rules the project is built under:
     S1 (search, sort on every column, a filter per column, a live count and a
     distinct no-matches state), L1 (hierarchy before decoration), Y2 (contrast
     as a figure), L3 (spacing as a rhythm), X1 (real controls, visible focus). */
  :root{
    --bg:#f6f7f9; --surface:#fff; --surface-2:#f0f2f5; --line:#d9dee5;
    --fg:#10141a; --muted:#5b6673; --accent:#3257d6; --accent-soft:#e5ebfb;
    --ok:#1f7a4d; --warn:#9a6100; --stop:#b3261e; --on-accent:#fff;
    --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px; --s6:40px; --ctl:32px;
  }
  @media (prefers-color-scheme:dark){:root{
    --bg:#0f1115; --surface:#161a21; --surface-2:#1d222b; --line:#2b323d;
    --fg:#e7ecf3; --muted:#9aa6b4; --accent:#8aa8ff; --accent-soft:#1e2740;
    --ok:#6ee7a8; --warn:#f0c36a; --stop:#ff8a80; --on-accent:#0f1115;
  }}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);
    font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .wrap{max-width:1100px;margin:0 auto;padding:var(--s5) var(--s4) var(--s6)}
  h1{font-size:22px;margin:0 0 var(--s1)}
  h2{font-size:15px;margin:var(--s6) 0 var(--s3)}
  .sub{color:var(--muted);font-size:12px;margin:0 0 var(--s5)}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:12px;
    padding:var(--s4);margin-bottom:var(--s4)}
  .overall{display:flex;align-items:baseline;gap:var(--s3);flex-wrap:wrap}
  .big{font-size:30px;font-weight:700;font-variant-numeric:tabular-nums}
  .track{height:10px;border-radius:999px;background:var(--surface-2);overflow:hidden;
    margin-top:var(--s3)}
  .fill{height:100%;background:var(--accent)}
  .secrow{display:grid;grid-template-columns:1fr 64px 120px;gap:var(--s3);
    align-items:center;padding:var(--s2) 0;border-bottom:1px solid var(--line)}
  .secrow:last-child{border-bottom:0}
  .secname{font-weight:600}
  .secpct{text-align:right;font-variant-numeric:tabular-nums;color:var(--muted)}
  .chip{display:inline-flex;align-items:center;height:22px;padding:0 8px;
    border-radius:999px;background:var(--surface-2);font-size:11px;font-weight:600}
  .chip.blocked{background:var(--stop);color:var(--on-accent)}
  .chip.executing{background:var(--accent);color:var(--on-accent)}
  .chip.done{background:var(--ok);color:var(--on-accent)}
  .chip.planned{border:1px solid var(--line)}
  .chip.dropped{color:var(--muted)}
  .bar{display:flex;gap:var(--s2);flex-wrap:wrap;align-items:center;margin-bottom:var(--s3)}
  input[type=search],select{height:var(--ctl);border:1px solid var(--line);border-radius:8px;
    background:var(--surface-2);color:var(--fg);padding:0 9px;font:inherit;font-size:13px}
  button{height:var(--ctl);border:1px solid var(--line);border-radius:8px;
    background:var(--surface-2);color:var(--fg);font:inherit;font-size:13px;
    padding:0 10px;cursor:pointer}
  button:focus-visible,input:focus-visible,select:focus-visible,th button:focus-visible{
    outline:2px solid var(--accent);outline-offset:2px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{padding:6px 8px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
  th{background:var(--surface);position:sticky;top:0;z-index:2}
  th button{width:100%;height:auto;padding:2px 0;background:none;border:0;
    font-weight:600;text-align:left;color:var(--fg);cursor:pointer}
  .arrow{color:var(--accent);font-weight:700}
  td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
  .filters td{padding:4px 6px;background:var(--surface-2)}
  .filters select{height:26px;font-size:12px;width:100%}
  .scroll{max-height:420px;overflow:auto;border:1px solid var(--line);border-radius:10px}
  .empty{padding:var(--s5);text-align:center;color:var(--muted)}
  .blocker{border:1px solid var(--stop);border-radius:12px;padding:var(--s4);
    margin-bottom:var(--s3);background:var(--surface)}
  .blocker h3{margin:0 0 var(--s1);font-size:14px}
  .blocker .who{color:var(--muted);font-size:12px;margin:0 0 var(--s3)}
  .blocker ol{margin:0;padding-inline-start:20px}
  .blocker li{margin-bottom:var(--s2)}
  .log{list-style:none;margin:0;padding:0;font-size:13px}
  .log li{display:grid;grid-template-columns:86px 1fr 72px;gap:var(--s3);
    padding:var(--s2) 0;border-bottom:1px solid var(--line)}
  .log .when{color:var(--muted);font-variant-numeric:tabular-nums;font-size:12px}
  .log .cost{text-align:right;color:var(--muted);font-variant-numeric:tabular-nums}
  @media (max-width:640px){
    .secrow{grid-template-columns:1fr 52px}
    .secrow .track{grid-column:1/-1}
    .log li{grid-template-columns:1fr}
  }
</style></head>
<body><div class="wrap">

<h1>Project progress</h1>
<p class="sub" id="sub"></p>

<div class="card">
  <div class="overall">
    <span class="big" id="pct"></span>
    <span id="ptsline" class="sub" style="margin:0"></span>
  </div>
  <div class="track"><div class="fill" id="fill"></div></div>
</div>

<h2 id="blockedHd">Blocked</h2>
<div id="blockers"></div>

<h2>Sections</h2>
<div class="card" id="sections"></div>

<h2>Tasks</h2>
<div class="bar">
  <input type="search" id="q" placeholder="Search tasks..." aria-label="Search tasks">
  <button id="clear" type="button">Clear filters</button>
  <span class="chip" id="count" aria-live="polite"></span>
</div>
<div class="scroll"><table id="tbl"><thead></thead><tbody></tbody></table></div>

<h2>Changelog</h2>
<ul class="log" id="log"></ul>

</div>
<script>
var DATA = __DATA__;

/* ---- the one place the view state lives; every render reads it (V1) ---- */
var view = { q: "", sort: { k: "id", dir: 1 }, f: {} };
/* built at runtime so this file stays ASCII (engineering rule 7) */
var UP = String.fromCharCode(8593), DOWN = String.fromCharCode(8595);

var COLS = [
  { k: "id", label: "Task" },
  { k: "title", label: "Title" },
  { k: "feature", label: "Feature" },
  { k: "state", label: "Status" },
  { k: "assignee", label: "Owner" },
  { k: "tier", label: "Tier" },
  { k: "mustness", label: "Mustness" },
  { k: "points", label: "Points", num: true },
  { k: "est_k", label: "Est k", num: true },
  { k: "actual_k", label: "Actual k", num: true }
];

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function visible() {
  var q = view.q.toLowerCase();
  return DATA.rows.filter(function (r) {
    var okQ = !q || COLS.some(function (c) {
      return String(r[c.k]).toLowerCase().indexOf(q) >= 0;
    });
    var okF = Object.keys(view.f).every(function (k) {
      return !view.f[k] || String(r[k]) === view.f[k];
    });
    return okQ && okF;
  });
}
function draw() {
  var rows = visible().slice();
  var s = view.sort;
  rows.sort(function (a, b) {
    var col = COLS.filter(function (c) { return c.k === s.k; })[0] || {};
    var va = a[s.k], vb = b[s.k];
    if (col.num) { return (va - vb) * s.dir; }
    return String(va).localeCompare(String(vb), undefined, { numeric: true }) * s.dir;
  });

  /* the header is painted from the state, not from the click that changed it (V1) */
  var head = "<tr>" + COLS.map(function (c) {
    var on = s.k === c.k;
    return '<th class="' + (c.num ? "num" : "") + '"' +
      (on ? ' aria-sort="' + (s.dir === 1 ? "ascending" : "descending") + '"' : "") +
      '><button type="button" data-k="' + c.k + '">' + esc(c.label) +
      (on ? '<span class="arrow"> ' + (s.dir === 1 ? UP : DOWN) + "</span>" : "") +
      "</button></th>";
  }).join("") + "</tr>";

  /* a filter per column, including the computed ones (S1, T2) */
  head += '<tr class="filters">' + COLS.map(function (c) {
    var vals = [];
    DATA.rows.forEach(function (r) {
      if (vals.indexOf(String(r[c.k])) < 0) { vals.push(String(r[c.k])); }
    });
    vals.sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
    if (vals.length > 25) { return "<td></td>"; }
    return "<td><select data-k=" + '"' + c.k + '"' + ' aria-label="Filter ' + esc(c.label) + '">' +
      '<option value="">All</option>' +
      vals.map(function (v) {
        return '<option value="' + esc(v) + '"' +
          (view.f[c.k] === v ? " selected" : "") + ">" + esc(v) + "</option>";
      }).join("") + "</select></td>";
  }).join("") + "</tr>";
  document.querySelector("#tbl thead").innerHTML = head;

  var body = rows.map(function (r) {
    return "<tr>" + COLS.map(function (c) {
      if (c.k === "state") {
        return '<td><span class="chip ' + esc(r.state) + '">' + esc(r.state) + "</span>" +
          (r.assumed ? ' <span class="chip">assumed</span>' : "") + "</td>";
      }
      return '<td class="' + (c.num ? "num" : "") + '">' + esc(r[c.k]) + "</td>";
    }).join("") + "</tr>";
  }).join("");
  /* no matches is its own state, not an empty table (S1) */
  document.querySelector("#tbl tbody").innerHTML = body ||
    '<tr><td class="empty" colspan="' + COLS.length +
    '">No task matches this search and these filters. Clear them to see all ' +
    DATA.rows.length + '.</td></tr>';

  document.getElementById("count").textContent =
    rows.length === DATA.rows.length ? DATA.rows.length + " tasks"
                                     : rows.length + " of " + DATA.rows.length;
}

document.getElementById("q").oninput = function () { view.q = this.value.trim(); draw(); };
document.getElementById("clear").onclick = function () {
  /* clears everything it claims to clear (A3) */
  view.q = ""; view.f = {};
  document.getElementById("q").value = "";
  draw();
};
document.addEventListener("click", function (e) {
  var b = e.target.closest("th button");
  if (!b) { return; }
  var k = b.dataset.k;
  view.sort = { k: k, dir: view.sort.k === k ? -view.sort.dir : 1 };
  draw();
});
document.addEventListener("change", function (e) {
  var sel = e.target.closest(".filters select");
  if (!sel) { return; }
  view.f[sel.dataset.k] = sel.value;
  draw();
});

/* ---- the parts that are not the table ---------------------------------- */
(function () {
  var o = DATA.overall;
  document.getElementById("sub").textContent =
    DATA.phase + " - generated " + DATA.generated +
    (o.budget_k ? " - " + o.spent_k + "k of " + o.budget_k + "k tokens spent"
                : " - " + o.spent_k + "k tokens spent");
  document.getElementById("pct").textContent = o.pct + "%";
  document.getElementById("ptsline").textContent =
    o.done + " of " + o.points + " points merged";
  document.getElementById("fill").style.width = o.pct + "%";

  document.getElementById("sections").innerHTML = DATA.sections.map(function (s) {
    return '<div class="secrow"><span class="secname">' + esc(s.feature) +
      (s.blocked ? ' <span class="chip blocked">' + s.blocked + " blocked</span>" : "") +
      "</span>" +
      '<span class="secpct">' + s.pct + "%</span>" +
      '<span class="track"><span class="fill" style="width:' + s.pct + '%"></span></span>' +
      "</div>";
  }).join("") || '<p class="empty">No tasks yet.</p>';

  var host = document.getElementById("blockers");
  if (!DATA.blocked.length) {
    document.getElementById("blockedHd").remove();
    host.remove();
  } else {
    host.innerHTML = DATA.blocked.map(function (b) {
      return '<div class="blocker"><h3>' + esc(b.id) + " - " + esc(b.title) + "</h3>" +
        '<p class="who">' + esc(b.blocked.why) + " - waiting on " + esc(b.blocked.owner) +
        " - since " + esc(b.blocked.since) + "</p><ol>" +
        b.blocked.steps.map(function (st) { return "<li>" + esc(st) + "</li>"; }).join("") +
        "</ol></div>";
    }).join("");
  }

  document.getElementById("log").innerHTML = DATA.changelog.map(function (c) {
    return '<li><span class="when">' + esc(c.at || "-") + "</span>" +
      "<span>" + esc(c.task) + " " + esc(c.title) + " - " + esc(c.who) +
      (c.rework_for ? " - rework for " + esc(c.rework_for) : "") +
      (c.attempts > 1 ? " - " + c.attempts + " attempts" : "") + "</span>" +
      '<span class="cost">' + c.actual_k + "k</span></li>";
  }).join("") || '<li class="empty">Nothing merged yet.</li>';
})();

draw();
</script>
</body></html>
"""


def cmd_selfcheck(a):
    """One runnable check that fails if the gate logic breaks."""
    global ROOT, DIR, TASKS, LEDGER, VELOCITY, CONFIG
    import contextlib
    import io
    import tempfile
    keep = ROOT
    quiet = lambda: contextlib.redirect_stdout(io.StringIO())
    with tempfile.TemporaryDirectory() as tmp:
        ROOT = tmp
        DIR, TASKS, LEDGER, VELOCITY, CONFIG = _paths()
        save_config({"phase": "pre-production", "wip_cap": 2, "budget": 100000,
                     "decisions": {}, "owners": dict(DEFAULT_OWNERS),
                     "must_features": ["F-1"]})

        def mk(tid, **kw):
            t = dict(id=tid, title=tid, assignee=kw.get("who", "FE-Felix"),
                     tier=kw.get("tier", "low"), feature=kw.get("feature", "F-1"),
                     mustness=kw.get("mustness", "Must"), size=kw.get("size", "M"),
                     reads=kw.get("reads", ["Index.md"]),
                     writes=kw.get("writes", ["app/**"]), needs=kw.get("needs", []),
                     done_when="true", status=kw.get("status", "queued"),
                     attempts=kw.get("attempts", 0), verified=None, reviewed=[],
                     rework_for=None, critical_path=False, risk=None,
                     assumed=kw.get("assumed", False))
            t["est"] = estimate(t)
            return t

        with open(os.path.join(ROOT, "Index.md"), "w") as f:
            f.write("x" * 400)                      # 100 tok

        # deps gate the ready queue, and an ASSUMED task sorts last
        ts = [mk("T-1"), mk("T-2", needs=["T-1"])]
        assert [t["id"] for t in ready(ts)] == ["T-1"], "unmet dep leaked into ready"
        ts = [mk("T-1", assumed=True), mk("T-2")]
        assert [t["id"] for t in ready(ts)] == ["T-2", "T-1"], "assumed not deprioritised"

        # check 1 is a real gate: wrong owner holds
        t = mk("T-1", who="BE-Bruno", writes=["app/**"])
        _, r = dispatch_checks(t, [t], 999999)
        assert not r[0][1], "wrong owner dispatched"
        # ...and an empty map holds rather than passing vacuously
        cfg = config(); cfg["owners"] = {}; save_config(cfg)
        _, r = dispatch_checks(mk("T-1"), [], 999999)
        assert not r[0][1], "empty ownership map passed vacuously"
        cfg["owners"] = dict(DEFAULT_OWNERS); save_config(cfg)

        # check 2: overlapping write sets never co-dispatch, disjoint ones do
        ts = [mk("T-1", status="in-flight", writes=["app/**"]),
              mk("T-2", writes=["app/components/**"])]
        _, r = dispatch_checks(ts[1], ts, 999999)
        assert not r[1][1], "overlapping write sets dispatched"
        ts[1]["writes"] = ["api/**"]; ts[1]["assignee"] = "BE-Bruno"
        _, r = dispatch_checks(ts[1], ts, 999999)
        assert r[1][1], "disjoint write sets blocked"

        # check 4: a retry must be frontier, and "mid" is not a tier
        t = mk("T-3", attempts=1)
        _, r = dispatch_checks(t, [t], 999999)
        assert not r[3][1], "low-tier retry allowed"
        t = mk("T-3b", tier="mid")
        _, r = dispatch_checks(t, [t], 999999)
        assert not r[3][1], "undefined tier accepted"

        # check 5: an oversized pack holds, a missing ref holds
        big = mk("T-4", reads=["Index.md", "huge.md"])
        with open(os.path.join(ROOT, "huge.md"), "w") as f:
            f.write("x" * 400000)
        _, r = dispatch_checks(big, [big], 999999)
        assert not r[4][1] and "trim" in r[4][2], "oversized pack dispatched"
        _, r = dispatch_checks(mk("T-5", reads=["nope.md"]), [], 999999)
        assert not r[4][1], "missing context ref dispatched"

        # check 6: single buffer, three bands
        t = mk("T-6", size="M")
        _, r = dispatch_checks(t, [t], int(t["est"] * 2))
        assert r[5][1] and "AMBER" not in r[5][2], "green band misread"
        _, r = dispatch_checks(t, [t], t["est"])
        assert r[5][1] and "AMBER" in r[5][2], "amber band missing"
        _, r = dispatch_checks(t, [t], t["est"] - 1)
        assert not r[5][1], "over-budget task dispatched"

        # est is not buffered — the ledger comparison stays honest
        tpp, _ = velocity()
        assert t["est"] == int(3 * tpp), "estimate() is padding the ledger"

        # rule 10: est frozen, rework never moves velocity, and clears after
        t = mk("T-7", size="M")
        est_at_plan = t["est"]
        record(t, 90000)
        v1, _ = velocity()
        t2 = mk("T-8", size="M"); t2["rework_for"] = "D-003"
        record(t2, 500000)
        v2, _ = velocity()
        assert v1 == v2, "rework polluted velocity"
        assert ledger()[0]["est"] == est_at_plan, "est was rewritten after the fact"

        # requeue resets attempts so rework is not forced to frontier
        ts = [mk("T-9", attempts=2, needs=["D-003"], status="merged")]
        save_tasks(ts)
        with quiet():
            cmd_requeue(argparse.Namespace(decision="D-003"))
        assert load_tasks()[0]["attempts"] == 0, "rework carried a failed-attempt count"

        # ---- kz-loopfix: the nested loop
        def ns(**kw):
            base = dict(action="round", task="T-L", agent=None, verdict=None,
                        findings=["f"], evidence="ran the suite", scope="",
                        tokens=0, abandon=False)
            base.update(kw)
            return argparse.Namespace(**base)

        def say(agent, verdict, **kw):
            with quiet():
                cmd_loop(ns(agent=agent, verdict=verdict, **kw))

        def refuses(msg, **kw):
            try:
                with quiet():
                    cmd_loop(ns(**kw))
            except SystemExit:
                return
            raise AssertionError(msg)

        say(None, None, action="open", scope="a bug")

        refuses("loop let the fixer speak first", agent="fixer", verdict="accept")
        refuses("loop accepted a verdict with no evidence",
                agent="critic", verdict="reject", evidence="")

        # inner loop runs as long as it needs to: reject, fix, reject, fix, accept
        say("critic", "reject"); say("fixer", "accept")
        say("critic", "reject"); say("fixer", "accept")
        say("critic", "reject"); say("fixer", "accept")
        assert loop_next(load_loop("T-L")) == "critic", "fix was not re-reviewed"
        assert loop_inner(load_loop("T-L")) == 6, "inner exchanges miscounted"
        refuses("gate ruled before A1 and A2 agreed", agent="gate", verdict="accept")

        say("critic", "accept")
        assert loop_next(load_loop("T-L")) == "gate", "critic accept did not reach the gate"
        refuses("loop closed before the gate ruled", action="close", tokens=1)

        # a FALSE ruling drops back into a fresh inner loop, not to the gate
        say("gate", "reject")
        loop = load_loop("T-L")
        assert loop_next(loop) == "critic", "FALSE ruling did not fall back to the critic"
        assert loop_cycle(loop) == 2, "FALSE ruling did not open a new cycle"
        assert loop_inner(loop) == 0, "inner counter did not reset after a ruling"
        refuses("loop closed on a FALSE ruling", action="close", tokens=1)

        # second cycle: shorter inner loop, then a TRUE ruling closes it
        say("critic", "reject"); say("fixer", "accept"); say("critic", "accept")
        say("gate", "accept")
        assert loop_next(load_loop("T-L")) is None, "TRUE ruling did not end the loop"
        refuses("loop accepted an exchange after a TRUE ruling",
                agent="critic", verdict="reject")
        say(None, None, action="close", tokens=5000)
        assert load_loop("T-L")["status"] == "agreed", "agreed loop did not close"

        # stall: the same finding surviving three outer cycles
        _write(loop_path("T-S"), {
            "task": "T-S", "scope": "s", "opened": 0, "tokens": 0, "status": "open",
            "exchanges": [{"agent": "critic", "verdict": "reject", "cycle": c,
                           "findings": ["same thing"], "evidence": "e", "ts": 0}
                          for c in (1, 2, 3)]})
        assert loop_stalled(load_loop("T-S")) == ["same thing"], "stall not detected"

        # secrets are caught before Production
        with open(os.path.join(ROOT, "app.py"), "w") as f:
            f.write('api_key = "hunter2hunter2"\n')
        assert scan_secrets(["app*"]), "secret scan missed a hardcoded credential"

        # the gate catches an abandoned Must and an unbuilt one
        save_tasks([mk("T-10", status="abandoned", mustness="Must")])
        try:
            with quiet():
                cmd_gate(None)
        except SystemExit as e:
            assert e.code == 1, "gate passed with an abandoned Must"
        else:
            raise AssertionError("gate did not exit")

        # a blocker without real steps is refused: one line is the blocker restated
        save_tasks([mk("T-20")])
        args = type("A", (), {"task": "T-20", "why": "no key", "owner": "the user",
                              "step": ["get a key"]})()
        try:
            with quiet():
                cmd_block(args)
        except SystemExit:
            pass
        else:
            raise AssertionError("block accepted a single vague step")

        args.step = ["Open the vendor console", "Copy the key into .env.local"]
        with quiet():
            cmd_block(args)
        t = find(load_tasks(), "T-20")
        assert t["status"] == "blocked", "block did not set the status"
        assert len(t["blocked"]["steps"]) == 2, "the steps were not kept with the task"

        # the dashboard reports the blocker and counts points, not tasks
        save_tasks(load_tasks() + [mk("T-21", size="S", status="merged"),
                                   mk("T-22", size="L")])
        d = dashboard_data()
        assert len(d["blocked"]) == 1, "the dashboard lost the blocked task"
        assert d["blocked"][0]["blocked"]["steps"], "the dashboard dropped the steps"
        pts_all = sum(POINTS[t["size"]] for t in load_tasks())
        assert d["overall"]["points"] == pts_all, "the dashboard is counting the wrong total"
        assert d["overall"]["pct"] == round(POINTS["S"] / pts_all * 100), \
            "progress is not merged points over all points"
        assert any(r["state"] == "blocked" for r in d["rows"]), "no row reads as blocked"
        assert {r["state"] for r in d["rows"]} <= set(STATE_LABEL.values()), \
            "a row carries a status the page has no word for"

        # unblock puts it back in the queue and takes the blocker with it
        with quiet():
            cmd_unblock(type("A", (), {"task": "T-20"})())
        t = find(load_tasks(), "T-20")
        assert t["status"] == "queued" and "blocked" not in t, "unblock left the blocker behind"

    ROOT = keep
    DIR, TASKS, LEDGER, VELOCITY, CONFIG = _paths()
    print("selfcheck ok")


# ---------------------------------------------------------------- cli

def main():
    p = argparse.ArgumentParser(prog="pb", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("init"); s.set_defaults(fn=cmd_init)
    s.add_argument("--phase", default="initialize", choices=list(PHASES))
    s.add_argument("--wip-cap", type=int, default=5)
    s.add_argument("--budget", type=int, default=0)

    s = sub.add_parser("owners"); s.set_defaults(fn=cmd_owners)
    s.add_argument("action", choices=["list", "set", "import"])
    s.add_argument("glob", nargs="?")
    s.add_argument("agent", nargs="?")

    s = sub.add_parser("musts"); s.set_defaults(fn=cmd_musts)
    s.add_argument("features", nargs="*")

    s = sub.add_parser("add"); s.set_defaults(fn=cmd_add)
    s.add_argument("id")
    s.add_argument("--title", required=True)
    s.add_argument("--assignee", required=True)
    s.add_argument("--tier", default="low", choices=list(TIERS))
    s.add_argument("--size", required=True, choices=list(POINTS))
    s.add_argument("--feature", default="")
    s.add_argument("--mustness", default="Must", choices=["Must", "Good", "Nice"])
    s.add_argument("--reads", nargs="*", default=[])
    s.add_argument("--writes", nargs="*", default=[])
    s.add_argument("--needs", nargs="*", default=[])
    s.add_argument("--done-when", default="")
    s.add_argument("--critical-path", action="store_true")
    s.add_argument("--risk", choices=["high"], default=None)
    s.add_argument("--assumed", action="store_true")

    sub.add_parser("ready").set_defaults(fn=cmd_ready)

    s = sub.add_parser("dispatch"); s.set_defaults(fn=cmd_dispatch)
    s.add_argument("task"); s.add_argument("--remaining", type=int, default=None)

    s = sub.add_parser("start"); s.set_defaults(fn=cmd_start); s.add_argument("task")
    s = sub.add_parser("verify"); s.set_defaults(fn=cmd_verify); s.add_argument("task")

    s = sub.add_parser("done"); s.set_defaults(fn=cmd_done)
    s.add_argument("task")
    s.add_argument("--actual", type=int, required=True)
    s.add_argument("--reviewed", nargs="*", default=[])
    s.add_argument("--force", action="store_true")

    s = sub.add_parser("fail"); s.set_defaults(fn=cmd_fail); s.add_argument("task")

    s = sub.add_parser("decide"); s.set_defaults(fn=cmd_decide)
    s.add_argument("decision"); s.add_argument("--answer", default="")

    s = sub.add_parser("requeue"); s.set_defaults(fn=cmd_requeue)
    s.add_argument("decision")

    s = sub.add_parser("loop"); s.set_defaults(fn=cmd_loop)
    s.add_argument("action", choices=["open", "round", "status", "close"])
    s.add_argument("task")
    s.add_argument("--scope", default="")
    s.add_argument("--agent", choices=["critic", "fixer", "gate"])
    s.add_argument("--verdict", choices=["accept", "reject"])
    s.add_argument("--findings", nargs="*", default=[])
    s.add_argument("--evidence", default="")
    s.add_argument("--tokens", type=int, default=0)
    s.add_argument("--abandon", action="store_true")

    s = sub.add_parser("block"); s.set_defaults(fn=cmd_block)
    s.add_argument("task"); s.add_argument("--why", required=True)
    s.add_argument("--owner", default="the user",
                   help="who can clear it: the user, an admin, a vendor")
    s.add_argument("--step", action="append", default=[],
                   help="one numbered step a human can follow; repeat it, at least twice")
    s = sub.add_parser("unblock"); s.set_defaults(fn=cmd_unblock); s.add_argument("task")
    s = sub.add_parser("dashboard"); s.set_defaults(fn=cmd_dashboard)
    s.add_argument("--out", default="progress.html")
    s.add_argument("--force-bat", action="store_true",
                   help="rewrite run.bat even if it already exists")
    sub.add_parser("gate").set_defaults(fn=cmd_gate)
    sub.add_parser("report").set_defaults(fn=cmd_report)
    sub.add_parser("selfcheck").set_defaults(fn=cmd_selfcheck)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
