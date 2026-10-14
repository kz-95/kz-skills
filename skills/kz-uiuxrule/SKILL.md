---
name: kz-uiuxrule
description: "A one-element or one-line UI change (a label, a colour, a button style, a column) goes to kz-fastfix, not here. Stack-neutral, style-neutral UI rules for building, reviewing and governing an interface beyond one element - tables, forms, charts, overlays, layout, theming, motion, diagrams, performance, accessibility. 57 UI, 6 motion, 21 chart and 10 diagram rules and 16 principles, each with the failure it prevents and its check. Sizes the work first; reads and checks only what it touches. Four modes - adopt the rules into a project, review against them, build under them, or run the full reviewer/fixer loop. Use when creating, changing, reviewing or standardising a component, a screen or a project's UI, or when a screen looks unprofessional and the reason is not obvious. UI is anything a person opens: a page, a generated report, a dashboard, an export, an email template. Not for backend-only work."
version: 2.4.0
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# Universal UI/UX rules

What any interface has to do and what breaks when it does not. It never picks a palette, a
typeface, a framework or a look: those are the project's.

## Step zero: the size test

Before reading a rule, apply the speed contract in `../kz-skill/SKILL.md` (engineering rule
29e). In short:

- **Trivial** (one element or one line, no new behaviour) -> `../kz-fastfix/`: at most the one
  `kz-flashrule` line that applies, at most one check, a one-line report. Do not read on.
- **Small/medium** (a component or a screen) -> mode 3 below, reading `../kz-flashrule/SKILL.md`
  first and running only the checks for what was touched.
- **Large** (a project, an audit, "make it production", a release) -> the full path: the
  mode's whole procedure, all checks, mode 4 where asked.

**Ask only when genuinely ambiguous.** If the request names the work, say in one line which
mode and scope you read from it and proceed. A card (`../kz-askcard/`, inline format: the
answers apply to this run only) is for adopt or review scope, two modes that both fit, or a
project whose own rules disagree with these. `../kz-askcard/hooks/ui-rule-purpose.mjs` repeats
this on hosts that can run a command before a skill call (wiring in its `README.md`).

If `.kz/lessons.jsonl` exists, run `python ../kz-reflect/scripts/reflect.py brief` first: it
lists what already went wrong here. At close-out, if something was corrected and the fix is
verified, offer `../kz-reflect/`.

## The modes

| Mode | The request sounds like | What it produces |
|---|---|---|
| **0. Glance** | a pasted screenshot, "quick look" | Three to six findings by rule id from the picture alone - `skills/ui-glance/` (one read, no card, no size test) |
| **1. Adopt** | "set up design rules", "we need standards" | One design-rule document in the project with an index, consolidated with what is there |
| **2. Review** | "check this screen", "audit the UI" | Findings by rule id, each with the measurement that proves it |
| **3. Build** | "make this page", "add a table", "fix this component" | The work, built under the rules, checked by what it touched |
| **4. Loop** | "make it right", "properly", "production" | Modes 2 and 3 run adversarially until reviewers and fixer agree |

Modes 1, 2 and 4, the review card, the speed dial, the close-out list and the file and
category tables: `references/modes.md`, the part for your mode, when you are in it.

## Mode 3 - Build

1. **Route.** Read `../kz-flashrule/SKILL.md`. Open `rules/INDEX.md` and the one or two
   sections its row names only when a flashrule line points there or none covers the work.
   A rule already read in this session is not read again.
2. **Build** what was asked and nothing more: no extra table, sort, empty state or feature
   that was not requested (engineering rule 28). Every rule in the sections read is in force,
   plus the set below. For a table, start from `snippets/filter-table.html`: sort on every
   column, a filter button per column opening a panel, a live count, every way to close the
   panel; it passes all ten checks.
3. **Check what you touched, once** (`../kz-uicheck/`): table -> `table-check.js` (+
   `popover-check.js`); form -> `form-check.js` (F1, F2) and `typing-check.js` at phone width
   (F8); dropdown -> `popover-check.js` (N2); modal -> `modal-check.js` (N1); controls ->
   `focus-check.js`; colour or theme -> `contrast-check.js` (Y2) in both themes; motion ->
   `motion-check.js` (M1-M6); diagram -> `diagram-check.js` (G1-G10); then `layout-audit.js`
   at one wide width and 375px. Without a browser pane:
   `python ../kz-uicheck/scripts/run-checks.py <page.html> --checks <names> --width 390`.
   Fix a finding, re-run that check only. Paste the output: measure, do not assert, and check
   the instrument first (a zero-width viewport gives confident, wrong numbers). Generated
   pages are UI too; a page copied from an older one is checked, not trusted.
4. **Leave a check in the project only when asked or in mode 4.** Never write check scripts
   or test files into the user's project unasked.

## Always in force, whatever the size

- **S1** - every table ships a search, sort on every column and a filter per column, with a
  live result count and a distinct no-matches state. **"Filter" means the T1 panel** - a
  button per column that opens sort, a value list with counts and a range for numbers -
  never an empty text box under each header. Title and filter rows form one header block,
  one line under the filters. Where row order is itself content, that order is the default
  and comes back in one click. Building one from scratch: read T1-T3 and Appendix A.
- **S2** - every destructive action is behind a confirm that names the target, with a
  clearly labelled cancel. Bulk deletes state the count. Never a bare click.
- **The safety floor** - input validation at trust boundaries, error handling that prevents
  data loss, security, and accessibility basics. A project convention that removes one of
  those is a bug in the convention.

## Order of precedence, highest first

1. An explicit instruction in the current task.
2. The project's own rules, wherever they live.
3. The existing code, when it is consistent. A rule followed on one screen and nowhere else
   is worse than either choice applied consistently.
4. These documents. A style or design skill ranks below them: it decides what the rules
   leave open, never what they state (`references/modes.md`).

Departing from a rule is fine; departing silently is not. Say which rule and why, in one
line, at the time.

## Where the rules are

`rules/INDEX.md` routes by keyword to `rules/ui-rules.md` (read by section, never whole;
Appendix Z before a large build), `chart-rules.md` (C1-C21), `motion-rules.md` (M1-M6),
`diagram-rules.md` (G1-G10) and `design-principles.md`; S1/S2 are in
`../kz-engrules/rules/engineering-rules.md`. Cite rules by ID (`T2`, `V3`, `C5`).
