#!/usr/bin/env python3
"""kz-reflect: a project's memory of what went wrong, and the path from a mistake to a better rule.

    reflect.py brief                 what this project has already learned (run at the start of a task)
    reflect.py log ...               record a mistake - ONLY after the fix has been verified
    reflect.py list                  every entry, newest last
    reflect.py propose [--id L-3]    what to change, and the steps to do it, for each entry
    reflect.py recurrences           rules and tags that keep coming back in this project
    reflect.py promote               lessons that have earned a place in the shared rules
    reflect.py render                rewrite .kz/LESSONS.md, the human-readable copy
    reflect.py selfcheck             run the script's own assertions

Storage: .kz/lessons.jsonl in the current directory (override with --dir or KZ_LESSONS_DIR).
One JSON object per line, append-only. LESSONS.md is generated from it and never edited by hand.

This script never edits a rule. It records, classifies and proposes; a person approves, and the change
is then made in the rules repository the normal way (rule, sample, check, validation).
Python 3.8+, standard library only.
"""
import argparse
import datetime
import json
import os
import re
import sys
import tempfile

OUTCOMES = {
    "STRENGTHEN-SUMMARY": "The rule existed and was not read. Put its distinguishing clause into the always-loaded "
                          "summary (the S-rule row, the skill's always-in-force list, the user's own instructions).",
    "CLARIFY-RULE": "The rule was read and misapplied. Reword it so the cheap reading is no longer available; "
                    "add a wrong/right sample showing the misreading.",
    "NEW-RULE": "No rule covered it. Propose one - after searching the rule index so a covered defect does not get a second rule.",
    "ADD-CHECK": "There was no check. Write one that fails on the defect, and watch it fail before fixing anything.",
    "FIX-CHECK": "A check existed and missed it. Fix the check, and prove it now fails on the old defect.",
    "LESSON-ONLY": "The mistake was in how it was measured, not in the rules (a stale page, a hidden pane, a check run "
                   "while the page was still moving). Record the habit; no rule changes.",
    "PROJECT-ONLY": "A decision that belongs to this project, not to the shared rules. Keep it here.",
}
STEPS = {
    "STRENGTHEN-SUMMARY": ["Find every always-loaded copy of the rule (S-row, SKILL.md always-in-force list, router, "
                           "the project's own instructions).", "Add the distinguishing clause to each, in the same words.",
                           "Add or extend a check that fails the cheap reading.", "Run it on the reference page first: "
                           "if the reference fails it, the reference is the next fix."],
    "CLARIFY-RULE": ["Quote the sentence that was misread.", "Reword it; state the figure or observation, not a judgement.",
                     "Add a wrong sample showing the misreading, and assert that it still fails."],
    "NEW-RULE": ["Search rule-index.md for the defect first; stop if a rule already covers it.",
                 "Write the rule invariant-first: the obligation, the failure that follows, the check.",
                 "Add a wrong/right sample to the reference page and an assertion that the wrong half still fails.",
                 "Add the check; run it on the old defect and watch it fail before the fix.",
                 "Update the counts, the index and the keyword router; run scripts/validate.py."],
    "ADD-CHECK": ["Write the smallest check that measures the claim, not a property near it.",
                  "Run it against the old defect and confirm it fails.", "Run it at phone width and in both themes."],
    "FIX-CHECK": ["Reproduce the miss: put the old defect back and confirm the check passes it.",
                  "Change the check to measure the claim.", "Confirm it now fails, then restore the fix."],
    "LESSON-ONLY": ["Write it as a habit to have, one paragraph, with the numbers that proved it.",
                    "Add it to the lessons appendix; do not add a rule."],
    "PROJECT-ONLY": ["Record it in the project's own rules; nothing in the shared set changes."],
}
FOUND_BY = ("check", "reviewer", "user", "self")
VAGUE = re.compile(r"\b(looks? (fine|good|ok|right)|seems? (fine|good|ok|right)|should work|probably|i think|appears to|"
                   r"works for me)\b", re.I)
EVIDENCE_OK = re.compile(r"\d|clean|pass|fail|measured|assert|\bcheck\b|screenshot|diff|log|output|rendered", re.I)


def store_dir(args):
    d = getattr(args, "dir", None) or os.environ.get("KZ_LESSONS_DIR") or os.path.join(os.getcwd(), ".kz")
    return d


def load(d):
    p = os.path.join(d, "lessons.jsonl")
    if not os.path.exists(p):
        return []
    out = []
    with open(p, encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            line = line.strip()
            if line:
                try:
                    out.append(json.loads(line))
                except ValueError:
                    sys.exit("lessons.jsonl line %d is not valid JSON; fix or remove it" % n)
    return out


def classify(covered, read, check, check_caught, instrument=False, project_only=False):
    """The decision order. Returns a list: a primary outcome first, then any secondary ones."""
    if project_only:
        return ["PROJECT-ONLY"]
    if instrument:
        return ["LESSON-ONLY"]
    out = []
    if covered == "yes":
        out.append("STRENGTHEN-SUMMARY" if read in ("no", "unknown") else "CLARIFY-RULE")
    else:
        out.append("NEW-RULE")
    if not check or check == "none":
        out.append("ADD-CHECK")
    elif check_caught == "no":
        out.append("FIX-CHECK")
    return out


def validate_evidence(text):
    t = (text or "").strip()
    if len(t) < 12:
        return "evidence is too short to be evidence: say what was measured or which check passed"
    if VAGUE.search(t):
        return "evidence reads as a judgement (%r): give a measurement, a check's output, or an assertion" % VAGUE.search(t).group(0)
    if not EVIDENCE_OK.search(t):
        return "evidence names no measurement or check: say what was run and what it returned"
    return ""


def cmd_log(args):
    err = validate_evidence(args.verified)
    if err:
        sys.exit("NOT LOGGED - a mistake is recorded only after the fix is verified.\n  " + err +
                 "\n  (Teaching before it works teaches the wrong thing.)")
    if args.found_by not in FOUND_BY:
        sys.exit("--found-by must be one of: " + ", ".join(FOUND_BY))
    for flag in ("what", "fix"):
        if len((getattr(args, flag) or "").strip()) < 8:
            sys.exit("--%s needs a real sentence" % flag)
    d = store_dir(args)
    entries = load(d)
    outcomes = classify(args.covered, args.read, args.check, args.caught, args.instrument, args.project_only)
    entry = {
        "id": "L-%d" % (len(entries) + 1),
        "date": datetime.date.today().isoformat(),
        "project": args.project or os.path.basename(os.getcwd()),
        "task": args.task or "",
        "what": args.what.strip(),
        "rule": (args.rule or "none").upper(),
        "covered": args.covered, "read": args.read,
        "check": args.check or "none", "check_caught": args.caught,
        "found_by": args.found_by,
        "outcomes": outcomes,
        "fix": args.fix.strip(),
        "verified": args.verified.strip(),
        "tags": [t.strip() for t in (args.tags or "").split(",") if t.strip()],
    }
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "lessons.jsonl"), "a", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    render(d)
    print("logged %s: %s -> %s" % (entry["id"], entry["rule"], " + ".join(outcomes)))
    print("next: reflect.py propose --id %s" % entry["id"])


def recurrence(entries):
    by = {}
    for e in entries:
        for k in [e["rule"]] + ["#" + t for t in e.get("tags", [])]:
            if k and k != "NONE":
                by.setdefault(k, []).append(e)
    return by


def cmd_brief(args):
    entries = load(store_dir(args))
    if not entries:
        print("no lessons recorded for this project yet.")
        return
    by = recurrence(entries)
    print("%d lesson(s) in this project. Read these before starting:" % len(entries))
    for k, es in sorted(by.items(), key=lambda kv: (-len(kv[1]), kv[0]))[: args.limit]:
        last = es[-1]
        print("  %-12s x%d  last: %s  (fix: %s)" % (k, len(es), last["what"][:90], last["fix"][:70]))


def cmd_list(args):
    for e in load(store_dir(args)):
        print("%-5s %s %-6s %-34s found by %-8s verified: %s" % (e["id"], e["date"], e["rule"], " + ".join(e["outcomes"]),
                                                              e["found_by"], e["verified"][:50]))


def cmd_propose(args):
    entries = [e for e in load(store_dir(args)) if not args.id or e["id"] == args.id]
    if not entries:
        sys.exit("no matching entry")
    for e in entries:
        print("%s  rule %s  - %s" % (e["id"], e["rule"], e["what"]))
        for o in e["outcomes"]:
            print("  PROPOSAL %s: %s" % (o, OUTCOMES[o]))
            for i, s in enumerate(STEPS[o], 1):
                print("      %d. %s" % (i, s))
        print("  This is a proposal. A person approves it; nothing here edits a rule.\n")


def cmd_recurrences(args):
    by = recurrence(load(store_dir(args)))
    for k, es in sorted(by.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        if len(es) >= args.min:
            print("%-14s x%d  %s" % (k, len(es), ", ".join(e["id"] for e in es)))


def cmd_promote(args):
    """Candidates for the SHARED rules: seen in several projects, or often. Reads every lessons file given."""
    entries = []
    for d in (args.also or []) + [store_dir(args)]:
        entries += load(d)
    by = recurrence(entries)
    found = False
    for k, es in sorted(by.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        projects = {e["project"] for e in es}
        if len(projects) >= args.projects or len(es) >= args.times:
            found = True
            print("PROMOTE? %-12s %d entries in %d project(s): %s" % (k, len(es), len(projects), "; ".join(sorted(projects))))
            print("         The shared rules or the lessons appendix are the place for it. A person decides.")
    if not found:
        print("nothing has recurred enough to leave this project (needs %d projects or %d entries)." % (args.projects, args.times))


def render(d):
    entries = load(d)
    lines = ["# Lessons", "", "Generated from `lessons.jsonl` by `reflect.py render`. Do not edit by hand.", ""]
    if not entries:
        lines.append("Nothing recorded yet.")
    for e in entries:
        lines += ["## %s - %s (%s)" % (e["id"], e["rule"], e["date"]), "",
                  "- **What went wrong:** " + e["what"],
                  "- **Found by:** %s; rule covered it: %s; read: %s; check: %s (caught it: %s)" % (
                      e["found_by"], e["covered"], e["read"], e["check"], e["check_caught"]),
                  "- **Outcome:** " + " + ".join(e["outcomes"]),
                  "- **Fix:** " + e["fix"],
                  "- **Verified by:** " + e["verified"], ""]
    with open(os.path.join(d, "LESSONS.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines))


def cmd_render(args):
    render(store_dir(args))
    print("wrote LESSONS.md")


def selfcheck():
    ok = []

    def check(cond, msg):
        if not cond:
            sys.exit("SELFCHECK FAILED: " + msg)
        ok.append(msg)

    check(validate_evidence("looks fine to me now") != "", "a judgement is refused as evidence")
    check(validate_evidence("ok") != "", "a one-word evidence is refused")
    check(validate_evidence("seems good, i think it works") != "", "hedged evidence is refused")
    check(validate_evidence("table-check.js clean; measured gap 4px") == "", "a measurement is accepted")
    check(classify("yes", "no", "table-check.js", "no") == ["STRENGTHEN-SUMMARY", "FIX-CHECK"], "unread rule + check that missed it")
    check(classify("yes", "yes", "none", "na") == ["CLARIFY-RULE", "ADD-CHECK"], "misread rule, no check")
    check(classify("no", "unknown", "none", "na") == ["NEW-RULE", "ADD-CHECK"], "no rule, no check")
    check(classify("yes", "no", "x.js", "yes", instrument=True) == ["LESSON-ONLY"], "an instrument error is a lesson, not a rule")
    check(classify("no", "no", "none", "na", project_only=True) == ["PROJECT-ONLY"], "a project decision stays in the project")
    with tempfile.TemporaryDirectory() as t:
        ns = argparse.Namespace(dir=t, project="p1", task="t", what="the filter row was an empty text box",
                                rule="t1", covered="yes", read="no", check="none", caught="na", found_by="user",
                                fix="defined the word in the always-loaded summary", verified="table-check.js fails the text box: 4 of 4",
                                tags="filters", instrument=False, project_only=False)
        cmd_log(ns)
        check(len(load(t)) == 1 and load(t)[0]["rule"] == "T1", "a verified lesson is logged, rule id upper-cased")
        bad = argparse.Namespace(**dict(vars(ns), verified="looks fine"))
        try:
            cmd_log(bad)
            check(False, "an unverified lesson must be refused")
        except SystemExit as e:
            check("NOT LOGGED" in str(e), "an unverified lesson is refused with a reason")
        check(len(load(t)) == 1, "the refused lesson was not written")
        cmd_log(argparse.Namespace(**dict(vars(ns), project="p2", what="another empty text box filter")))
        by = recurrence(load(t))
        check(len(by["T1"]) == 2, "recurrence counts a rule across entries")
        pa = argparse.Namespace(dir=t, also=[], projects=2, times=3)
        import io, contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            cmd_promote(pa)
        check("PROMOTE? T1" in buf.getvalue(), "a rule seen in two projects is offered for promotion")
        check(os.path.exists(os.path.join(t, "LESSONS.md")), "LESSONS.md is generated")
    print("selfcheck ok: %d assertions" % len(ok))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dir", help="where lessons live (default ./.kz or $KZ_LESSONS_DIR)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("log")
    s.add_argument("--what", required=True); s.add_argument("--fix", required=True)
    s.add_argument("--verified", required=True, help="the measurement or check output that shows the fix holds")
    s.add_argument("--found-by", required=True, dest="found_by", choices=FOUND_BY)
    s.add_argument("--rule", default="none"); s.add_argument("--task"); s.add_argument("--project")
    s.add_argument("--covered", choices=("yes", "no"), default="no", help="did a rule already cover this?")
    s.add_argument("--read", choices=("yes", "no", "unknown"), default="unknown", help="had the agent read that rule?")
    s.add_argument("--check", help="name of the check that exists for it, or none")
    s.add_argument("--caught", choices=("yes", "no", "na"), default="na", help="did that check catch it?")
    s.add_argument("--tags"); s.add_argument("--instrument", action="store_true", help="the mistake was in the measurement")
    s.add_argument("--project-only", action="store_true", dest="project_only")
    s.set_defaults(fn=cmd_log)
    b = sub.add_parser("brief"); b.add_argument("--limit", type=int, default=8); b.set_defaults(fn=cmd_brief)
    sub.add_parser("list").set_defaults(fn=cmd_list)
    p = sub.add_parser("propose"); p.add_argument("--id"); p.set_defaults(fn=cmd_propose)
    r = sub.add_parser("recurrences"); r.add_argument("--min", type=int, default=2); r.set_defaults(fn=cmd_recurrences)
    m = sub.add_parser("promote"); m.add_argument("--projects", type=int, default=2); m.add_argument("--times", type=int, default=3)
    m.add_argument("--also", action="append", help="another project's .kz directory to read as well")
    m.set_defaults(fn=cmd_promote)
    sub.add_parser("render").set_defaults(fn=cmd_render)
    sub.add_parser("selfcheck").set_defaults(fn=lambda a: selfcheck())
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
