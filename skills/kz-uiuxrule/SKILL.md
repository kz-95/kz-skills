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
- **Small/medium** (a component or a screen) -> mode 3 below: `packs/LOOKUP.md`, the one pack
  its row names, and only that pack's checks.
- **Large** (a project, an audit, "make it production", a release) -> the full path: the
  mode's whole procedure, the rule ledger (below), all checks, mode 4 where asked.

**The rule ledger, on the full path only.** Reading the whole corpus at once loses the rules
in its middle, so the full path goes through it one question at a time:
`python scripts/ledger.py init` writes every question of `rules/questions.md` (the 94 rules, then the chart types, chart
nevers, generated-UI tells, things not to do and principles, 179 in all) into `.kz/ledger.md`
in the project; mark each row Applies yes / no from its "Applies when" alone, read the full text
only of the rules marked yes (by `rules/INDEX.md` or the pack that holds them), and before
saying done give each yes a Verdict and its Evidence (the check and what it printed, or the file
and line). `python scripts/ledger.py status` must print `complete`. The ledger is the one file
the full path writes into the project; say so when you create it, and a later run reuses it.

**The first kz call in a session asks one card** (`../kz-askcard/`): the type of work, from
the rows of `packs/LOOKUP.md` with the matched one marked (recommended), and the size
(trivial / component / project). Later calls reuse the answer. After that, ask only when
genuinely ambiguous: say in one line which mode and scope you read and proceed; a card is for
adopt or review scope, two modes that both fit, or a project whose own rules disagree with
these. `../kz-askcard/hooks/ui-rule-purpose.mjs` prints the first-call card on hosts that can
run a command before a skill call (wiring in its `README.md`).

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

1. **Route.** Read `packs/LOOKUP.md` (about 2 KB) and the one pack whose words match the
   work; two match, read both. Each pack is generated from the rule files by
   `scripts/build-index.py` and holds the rules in full, the appendix it needs, the snippet
   and the exact check command. Open `rules/INDEX.md` and its sections only when no pack
   covers the work. A pack or rule already read in this session is not read again.
2. **Build** what was asked and nothing more: no extra table, sort, empty state or feature
   that was not requested (engineering rule 28). Every rule in the sections read is in force,
   plus the set below. For a table, start from `snippets/filter-table.html`: sort on every
   column, a filter button per column opening a panel, a live count, every way to close the
   panel; it passes every check.
3. **Check what you touched, once** (`../kz-uicheck/`), on the screen the work is on: the
   pack names its checks; in short, table -> `table-check.js` (+
   `popover-check.js`); form -> `form-check.js` (F1, F2) and `typing-check.js` at phone width
   (F8); dropdown -> `popover-check.js` (N2); modal -> `modal-check.js` (N1); controls ->
   `focus-check.js`; colour or theme -> `contrast-check.js` (Y2) in both themes; motion ->
   `motion-check.js` (M1-M6); diagram -> `diagram-check.js` (G1-G10); toast ->
   `toast-check.js` (A1, A2); tooltip or `[?]` -> `explain-check.js` (B2); then
   `layout-audit.js` at one wide width and 375px. Without a browser pane:
   `python ../kz-uicheck/scripts/run-checks.py <page.html> --checks <names> --width 390`, with
   `--hash ROUTE`, `--tap "#tab,#open"` and `--wait SELECTOR` to reach the screen. A run that
   reports WRONG SCREEN is a failure: the check never saw the work.
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

`packs/LOOKUP.md` routes by keyword to one generated pack per type of work (never edit a pack:
change the rule file and run `python scripts/build-index.py`). For the full path,
`rules/questions.md` asks every rule, chart type, tell, lesson and principle as one yes/no
question (the ledger), and
`rules/INDEX.md` routes by keyword to `rules/ui-rules.md` (read by section, never whole;
Appendix Z before a large build), `chart-rules.md` (C1-C21), `motion-rules.md` (M1-M6),
`diagram-rules.md` (G1-G10) and `design-principles.md`; S1/S2 are in
`../kz-engrules/rules/engineering-rules.md`. Cite rules by ID (`T2`, `V3`, `C5`).
