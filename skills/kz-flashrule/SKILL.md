---
name: kz-flashrule
description: "The core of the kz rules on one page - the twenty-odd lines agents break most (layout at 375px, motion, tables and the T1 filter panel, contrast in both themes, typing in a field, modals, the coloured side stripe), plus one line each for toasts, the Saved note and tooltips, each with its rule ID and the one check that catches it. Everything else is one generated pack per type of work, found through kz-uiuxrule/packs/LOOKUP.md. The default first read for small and medium UI work and a fast rule check of finished work; not a copy of every rule. The source rule always wins. Triggers on \"/kz-flashrule\", \"flash rule\", \"fast rule check\", \"critical rules\", \"quick check\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-flashrule

**The core, not the corpus.** These are the lines agents break most; cite the rule ID, and the source rule wins.
For anything not here, read [packs/LOOKUP.md](../kz-uiuxrule/packs/LOOKUP.md), then the one pack whose words match the work, and run that pack's checks.
Trivial work reads only the one line that applies (speed contract, [kz-skill](../kz-skill/SKILL.md)). A screenshot only -> [ui-glance](../kz-uiuxrule/skills/ui-glance/SKILL.md).

**Hard rule for this lane.** Run only the one [kz-uicheck](../kz-uicheck/SKILL.md) check named for the change, once, on a settled page, on the screen the work is on: `python ../kz-uicheck/scripts/run-checks.py page.html --checks <that one> --width 375 --scheme light`.
Never run `run-checks.py` without `--checks`, never all checks, never a check the change did not touch.
Label, text or style -> none, or `contrast-check` with `--scheme both` if a colour changed; table -> `table-check`; filter or dropdown -> `popover-check` (a chart filter -> `table-check`); form field -> `form-check`; toast -> `toast-check`; tooltip -> `explain-check`; layout -> `layout-audit` at 375px.
A new screen: the check for its kind, then `layout-audit` at 375px; nothing else.
**A check that saw the wrong screen counts as failed.** Point it at the work with `--hash ROUTE`, `--tap "#tab,#open"` and `--wait SELECTOR`; a run that prints WRONG SCREEN is a failure, never a clean result.
The "Fast check" column names what to look for, not extra checks to run; write no harness, test or scratch copy of your own to check a page.

## Floor

| ID | Rule | Fast check |
|---|---|---|
| 26 | Never simplify away validation at trust boundaries, data-loss handling, security or accessibility basics. | The diff removes no guard, check or try/catch. |
| 2 | Never invent APIs, files, functions, behaviour or test results. | Grep every name you cite; every "passes" has its output beside it. |
| 29e | Verification is proportional to the change; nothing written into the user's project unasked. | The checks run match what changed; after a fix only the failed one re-ran. |
| 7 | ASCII only in source and docs: no em dash, curly quote, arrow or glyph. | `grep -nP '[^\x00-\x7F]'` on the changed files finds nothing. |
| S2 | Every destructive action opens a confirm modal naming the target, with a labelled cancel. | Each delete, remove, clear or reset opens it, a bulk one states the count; no `window.confirm`. |

## The lines agents break most

| ID | Rule | Fast check |
|---|---|---|
| S1 | A table ships search, sort on every column, a T1 filter panel per column, a live count and a no-match state. | `table-check` `NOSORT`, `NOSEARCH`, `NOCOUNT`; sort a number column: 9 before 10. |
| T1 | A filter is a panel (sort, value list with counts, range), never a text box or select. Chart and dashboard filters too; chips only up to 6 values, with a count and a clear. Start from `../kz-uiuxrule/snippets/filter-table.html`. | `table-check` `BOX`, `CHARTBOX`. |
| T2 | Every column gets a filter, computed ones too; materialise the value onto the row. | `table-check` `NOFILTER`. |
| F8 | Typing never rebuilds the field, moves its caret, moves it on screen or zooms (inputs 16px or more on a phone). | `typing-check` `REBUILT`, `CARET`, `MOVED`, `ZOOM`, at 375px. |
| F9 | Enter moves to the next field; only the last submits. | `typing-check` `ENTER`. |
| N1 | A modal locks scroll, focus and clicks behind it; Escape closes it and focus returns to the trigger. | `modal-check` `SCROLL`, `BACKDROP`, `ESCAPE`, `FOCUS`, `RETURN`. |
| N2 | Every panel closes by its trigger, an outside tap, Escape, and Done on touch. | `popover-check` `STUCK`, `OUTSIDE`, `ESCAPE`, `NODONE`. |
| V3 | The layout holds at 375px with touch: nothing overflows, clips or overlaps; tap targets are 44px. | `layout-audit` `OVERFLOW`, `CLIPPED`, `TEXT OVERLAP`, `SMALL TOUCH TARGET`. |
| L5 | Controls in one row share one height. | `layout-audit` `RAGGED ROW`. |
| Y2 | Text meets 4.5:1 (3:1 large) on its real background, in both themes. | `contrast-check` `LOW`, with `--scheme both`. |
| Y3 | A theme is derived from tokens and covers the chrome, scrollbar included; no undefined `var(--x)`. | `layout-audit` `UNDEFINED TOKEN`; `contrast-check` in the other theme. |
| M1 | Motion explains a state change or is absent; reduced motion keeps the change; never a layout property. | `motion-check` `LAYOUTPROP`, `NOREDUCE`. |
| M3 | Nothing enters from `scale(0)`; a popover grows from the side facing its trigger. | `motion-check` `SCALE0`, `ORIGIN`. |
| M4 | Never `transition: all`, never ease-in on interface motion. | `motion-check` `ALL`, `EASEIN`. |
| M5 | Every button shows a pressed state while held, with no delay. | `motion-check` `NOPRESS`. |
| D6 | No coloured stripe down one side of a card, toast, list item or callout (border, `::before` bar or inset shadow); status is a glyph, and an error colours the whole border, one width on every side. | `layout-audit` `STRIPE`. |

## One line each, the pack has the rest

| ID | Rule | Fast check |
|---|---|---|
| A1 | One toast system for the whole app: one `role="status"` region at one edge, a stack capped at 3, a manual dismiss, errors stay longer. Pack: [feedback](../kz-uiuxrule/packs/feedback.md). | `toast-check`. |
| A2 | The same toast again counts on the node already on screen and restarts its timer; it never restacks. | `toast-check`. |
| A1 | A save the user can see happen (autosave, inline edit) shows a quiet Saved note beside it, not a toast per change; start from `../kz-uiuxrule/snippets/saved-note.html`. | Edit, wait: "Saved" appears beside the field and nothing stacks. |
| B2 | Every button is explainable: a tooltip on hover and focus, a tappable `[?]` on touch; the accessible name never depends on either. Pack: [explain](../kz-uiuxrule/packs/explain.md). | `explain-check`. |
| kz-askcard | First kz call in a session: one card, type (from LOOKUP, one recommended) and size; later calls reuse the answer. | One card this session; every line has a recommendation. |

When every line that applies is met (read in the code; measured only by the checks the hard rule names), small and medium work is fit to hand over; large work still gets its full review.
