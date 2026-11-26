#!/usr/bin/env python3
"""The rule ledger: every kz rule as one yes/no question, decided and evidenced one line at a time.

For the full path (a project, an audit, "make it production", a release). Reading the whole rule
corpus at once loses the rules in its middle; a ledger row per rule, written down, does not.

    python ledger.py init   [--out .kz/ledger.md]   copy every question into the project's ledger
    python ledger.py status [--out .kz/ledger.md]   say what is left; prints "complete" and exits 0
                                                    only when nothing is

The questions live in ../rules/questions.md. A ledger row is

    | ID | Applies when | Question | Check | Applies | Verdict | Evidence |

Applies is yes, no or ?. Verdict is pass or fail. Evidence is the check and what it printed, or
for a "read" check the file and line that shows the rule holds. `init` never overwrites a ledger
that has answers in it; it adds rows for rules the ledger does not have yet and leaves the rest.
"""
import argparse
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
QUESTIONS = os.path.join(HERE, "..", "rules", "questions.md")
ROW = re.compile(r"^\|\s*([A-Z]\d+[a-z]?)\s*\|(.*)\|\s*$")
HEAD = "| ID | Applies when | Question (yes = holds) | Check | Applies | Verdict | Evidence |"
RULE = "|---|---|---|---|---|---|---|"


def cells(line):
    m = ROW.match(line)
    if not m:
        return None
    return [m.group(1)] + [c.strip() for c in m.group(2).split("|")]


def questions():
    """[(section heading or None, [id, applies when, question, check])] in file order."""
    out = []
    for line in io.open(QUESTIONS, encoding="utf-8"):
        line = line.rstrip("\n")
        if line.startswith("## "):
            out.append((line, None))
            continue
        c = cells(line)
        if c and len(c) == 4:
            out.append((None, c))
    return out


def read_ledger(path):
    rows = {}
    if not os.path.exists(path):
        return rows
    for line in io.open(path, encoding="utf-8"):
        c = cells(line.rstrip("\n"))
        if c and len(c) == 7:
            rows[c[0]] = c
    return rows


def init(path):
    have = read_ledger(path)
    lines = ["# Rule ledger", "",
             "Written by `kz-uiuxrule/scripts/ledger.py init`. Fill Applies (yes / no / ?) for every row from",
             "\"Applies when\" alone, read the full rule for each yes, then fill Verdict (pass / fail) and",
             "Evidence. `ledger.py status` prints `complete` when nothing is left.", ""]
    added = 0
    open_table = False
    for head, c in questions():
        if head:
            lines += (["", head, ""] if open_table else [head, ""]) + [HEAD, RULE]
            open_table = True
            continue
        old = have.get(c[0])
        tail = old[4:7] if old else ["", "", ""]
        added += 0 if old else 1
        lines.append("| " + " | ".join(c + tail) + " |")
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    io.open(path, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
    print("wrote %s: %d rows, %d new, %d kept with their answers" % (path, added + len(have), added, len(have)))


def status(path):
    if not os.path.exists(path):
        print("no ledger at %s: run `ledger.py init` first" % path)
        return 2
    rows = read_ledger(path)
    want = [c[0] for h, c in questions() if c]
    missing = [i for i in want if i not in rows]
    unmarked, unsure, open_, failed, bad = [], [], [], [], []
    for i in want:
        if i not in rows:
            continue
        applies, verdict, evidence = (x.lower() for x in rows[i][4:7])
        if applies not in ("yes", "no", "?"):
            (unmarked if not applies else bad).append(i)
        elif applies == "?":
            unsure.append(i)
        elif applies == "yes":
            if verdict not in ("pass", "fail") or not evidence:
                open_.append(i)
            elif verdict == "fail":
                failed.append(i)
    yes = [i for i in want if i in rows and rows[i][4].lower() == "yes"]
    print("%d rules, %d apply, %d do not" % (len(want), len(yes),
          sum(1 for i in want if i in rows and rows[i][4].lower() == "no")))
    report = [("not in the ledger (run init again)", missing), ("Applies left empty", unmarked),
              ("Applies is not yes, no or ?", bad), ("still ? - decide yes or no", unsure),
              ("apply but have no Verdict or no Evidence", open_), ("fail", failed)]
    left = False
    for label, ids in report:
        if ids:
            left = True
            print("  %s: %s" % (label, ", ".join(ids)))
    if left:
        return 1
    print("complete")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("cmd", choices=["init", "status"])
    ap.add_argument("--out", default=os.path.join(".kz", "ledger.md"))
    a = ap.parse_args()
    if a.cmd == "init":
        init(a.out)
        return 0
    return status(a.out)


if __name__ == "__main__":
    sys.exit(main())
