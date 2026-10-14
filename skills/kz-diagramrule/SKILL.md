---
name: kz-diagramrule
description: "The diagram part of the kz UI rules on its own - ten rules (G1-G10) for architecture diagrams, flowcharts, sequences, state machines, data models and swimlanes, with the budget, cut order, line and label numbers behind them, and diagram-check.js to measure them on the drawn page. Use when the work is only a diagram - drawing, reviewing or fixing one - and the rest of kz-uiuxrule is not needed. Triggers on \"/kz-diagramrule\", \"diagram rules\", \"review this diagram\", \"architecture diagram\", \"flowchart\", \"draw a diagram\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-diagramrule

The diagram rules without the rest of the corpus: a lane into
[`diagram-rules.md`](../kz-uiuxrule/rules/diagram-rules.md), which `kz-uiuxrule` also routes to
for its G category, not a copy of it. The speed contract in `../kz-skill/SKILL.md` holds: moving
one label or line is trivial (the `kz-flashrule` G line, `diagram-check` once); drawing or
reviewing a diagram reads the file.

## When to use this rather than kz-uiuxrule

| The work | Use |
|---|---|
| Only a diagram: boxes, the lines between them, their labels - an architecture, a flow, a sequence, a state machine, a data model, a swimlane | **This skill** |
| A page or screen that holds a diagram among other UI (a docs page, a dashboard) | `../kz-uiuxrule/` - its INDEX routes the diagram part here as well |
| A chart: values on scales (a bar, a line, a KPI) | `../kz-uiuxrule/` section C, [`chart-rules.md`](../kz-uiuxrule/rules/chart-rules.md) |
| A sankey or a funnel with counts | Both: the chart rules for the values, these for the lines |

## What loads when

| Request | Files read |
|---|---|
| "Review this architecture diagram" | this SKILL.md + `diagram-rules.md` + `diagram-check.js` |
| "Draw a flowchart of checkout" | the same; `../kz-askcard/` only if the purpose is unclear |
| "A chart of revenue by month" | not this skill: `kz-uiuxrule` section C, `chart-rules.md` |

## What to do

1. **Ask only if genuinely unclear** - review or draw, what the reader must understand from
   it, and for whom (one `../kz-askcard/` card). Otherwise state what you read and go on.
2. **Read [`diagram-rules.md`](../kz-uiuxrule/rules/diagram-rules.md)** - the ten rules and
   the appendix of numbers. It is short and complete on its own.
3. **Before drawing anything**, answer in order: does it need a diagram at all, and which
   form does the question ask for (G1); does it fit the budget, and if not what is cut or
   split (G2); and only then the layout - lines on two axes (G3), one port per line (G4),
   around every box (G5), labels beside their lines (G6).
4. **Measure, then report.** Paste
   [`diagram-check.js`](../kz-uicheck/checks/diagram-check.js) into the console of the page at
   a wide width and at 375px, or run
   `python ../kz-uicheck/scripts/run-checks.py page.html --checks diagram-check`; after a fix
   re-run only it. G1 and the
   key's completeness (G7) are judgement: test them by hand as each rule's check line says.
5. **Report by rule ID**, one row per finding, with the measurement behind it:

| Rule | Found | Change to | Why |
|---|---|---|---|
| G6 | label `retry` plate 1px from its line | move the plate 8px to the side of the line | on the line it hides where the connection goes |
| G8 | `svg` 375px wide at 375px, `viewBox` 1280 wide | `min-width: 1280px` inside an `overflow-x: auto` box | shrunk, its 12px labels draw at under 4px |

A finding with no measurement is an opinion. A documented departure is not a finding.

## Always in force

`kz-engrules` applies to every task, and the safety floor holds: a diagram is a named figure
(G9) and never says something with colour alone (G10), whatever the style says.

Several rules and numbers here are adapted from the connector rules and complexity budget of
[diagram-design](https://github.com/cathrynlavery/diagram-design) by Cathryn Lavery (MIT).
