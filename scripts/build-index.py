#!/usr/bin/env python3
"""Generate docs/rule-index.md from the rule files, so the index cannot drift from the rules.

    python scripts/build-index.py          write docs/rule-index.md
    python scripts/build-index.py --check  exit 1 if the file on disk is out of date (used by CI)

It reads the first bold sentence of every table row whose first cell is a rule ID
(`| T1 | **A column filter is a panel...** ...`) in ui-rules.md and chart-rules.md.
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = "https://kz-95.github.io/kz-skills"
SOURCES = ["skills/kz-uiuxrule/rules/ui-rules.md", "skills/kz-uiuxrule/rules/chart-rules.md"]
OUT = os.path.join(ROOT, "docs", "rule-index.md")

CAT = {"D": "Fitting the design system", "L": "Layout, spacing and the mobile shell",
       "B": "Buttons and their explainers", "T": "Tables and columns", "F": "Forms and input",
       "A": "Actions and feedback", "N": "Overlays and navigation", "Y": "Type, colour and theming",
       "M": "Motion", "P": "Performance and content", "X": "Accessibility and semantics", "K": "Copy",
       "V": "Verification", "S": "Standing rules", "C": "Charts and data"}
# the reference page groups motion under type/theme, and charts under one summary anchor
ANCHOR = {"D": "d", "L": "l", "B": "b", "T": "t", "F": "f", "A": "a", "N": "n", "Y": "y", "M": "y",
          "P": "p", "X": "x", "K": "k", "V": "v", "S": "summary", "C": "summary"}


def build():
    rules = {}
    for rel in SOURCES:
        text = io.open(os.path.join(ROOT, rel), encoding="utf-8", newline="").read()
        for line in text.replace("\r\n", "\n").split("\n"):
            m = re.match(r"^\| ([A-Z]\d+[a-z]?) \| \*\*(.+?)\*\*", line)
            if m:
                rules.setdefault(m.group(1)[0], []).append((m.group(1), m.group(2).strip()))
    total = sum(len(v) for v in rules.values())
    out = ["# Rule index", "",
           "Every rule in `kz-uiuxrule`, one line each, with the category it lives in. **Generated from the rule files**",
           "by `scripts/build-index.py` - do not edit by hand. The full text of each rule, with the failure it prevents and",
           "the check that catches it, is in [`ui-rules.md`](../skills/kz-uiuxrule/rules/ui-rules.md) and",
           "[`chart-rules.md`](../skills/kz-uiuxrule/rules/chart-rules.md). To find a rule by the words of your task rather",
           "than its letter, use the keyword router, [`INDEX.md`](../skills/kz-uiuxrule/rules/INDEX.md).", "",
           "%d rules. Each category links to its live wrong/right samples." % total, ""]
    for k in "DLBTFANYMPXKVSC":
        if k not in rules:
            continue
        out += ["## %s - %s" % (k, CAT[k]), "",
                "Live samples: [%s](%s/reference/ui-rules-visual.html#%s)" % (CAT[k], PAGES, ANCHOR[k]), "",
                "| ID | Rule |", "|---|---|"]
        out += ["| %s | %s |" % (i, t.replace("|", "\\|")) for i, t in rules[k]]
        out.append("")
    return "\n".join(out), total


def main():
    text, total = build()
    if "--check" in sys.argv:
        have = io.open(OUT, encoding="utf-8", newline="").read() if os.path.exists(OUT) else ""
        if have != text:
            print("docs/rule-index.md is out of date - run: python scripts/build-index.py")
            return 1
        print("rule index up to date (%d rules)" % total)
        return 0
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(text)
    print("wrote docs/rule-index.md (%d rules)" % total)
    return 0


if __name__ == "__main__":
    sys.exit(main())
