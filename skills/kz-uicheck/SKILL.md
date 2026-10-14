---
name: kz-uicheck
description: "Ten runnable browser checks that measure an interface instead of judging it: layout audit (overflow, overlap, clipped text, tap targets, SVG focus ring, undefined CSS variable, wrapped sequence), table check (text-box filters, missing filter or sort), typing check (field rebuilt or caret jumped while typed), popover check (a panel that cannot be closed), contrast check (under 4.5:1, both themes), modal check (scroll lock, focus, backdrop, Escape), focus check, form check, motion check (transition all, ease-in, scale(0), no press state) and diagram check (slanted or stacked lines, a line behind a box, a label on its line, a diagram shrunk on a phone, no accessible name). Paste into the console; no build step. Run only the checks for what changed, once; all ten only for a release or a full audit. Triggers on \"/kz-uicheck\", \"check this page\", \"layout audit\", \"table check\", \"contrast check\", \"diagram check\", \"verify the UI\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-uicheck

The instruments behind `kz-uiuxrule`'s V rules: a rule with no check gets broken by the
person who wrote it. Plain ES5 in an IIFE: paste one into the browser console of the page.
Nothing to install, no selectors to configure, no framework assumed.

**Run only the checks for what changed** (the speed contract, `../kz-skill/SKILL.md`; rule
29e). One line or element: at most the one check that covers it. A component or screen: its
checks (table -> `table-check` + `popover-check`, form -> `form-check` + `typing-check` at
375px, dropdown -> `popover-check`, modal -> `modal-check`, motion -> `motion-check`, diagram
-> `diagram-check`, colour/theme -> `contrast-check` in both themes), then `layout-audit` at
one wide width and 375px. After a fix, re-run only the check that failed. All ten, at three
widths and both themes: mode 4, "make it production", a release. Never copy a check into the
user's project unless asked.

Every finding code and skip attribute (`data-*-check="skip"`) in full: `references/checks.md`.

| Check | Catches | Rule |
|---|---|---|
| `checks/layout-audit.js` | Page overflow, overlap, clipped text, ragged control rows, tap targets under 44px, SVG text out of its viewBox, `FOCUS BOX`, `UNDEFINED TOKEN`, `WRAPPED SEQUENCE`, `COVERED` | `V3`, `L5`, `L8`, `L10`, `L11` |
| `checks/table-check.js` | A column filter that is a bare text box or select instead of a panel, a column with no filter, a table with no sort, a header whose title and filter rows are split by a line or whose filter sits under 4px from one (`FILTERGAP`, measured in px), a filter that drives a chart built as chips, tick boxes, a select or a text box instead of the panel (`CHARTBOX`); and, as advisories, no search, no live count, headers with no explainer. Skip a deliberately wrong sample with `data-table-check="skip"` | `S1`, `T1`-`T3` |
| `checks/typing-check.js` | A field rebuilt mid-word, a caret thrown to the end, a field that moves while typed into, text under 16px that zooms on focus | `F8` |
| `checks/popover-check.js` | A panel that cannot be closed: trigger only opens (`STUCK`), Escape or outside click does nothing, no Done on touch | `N2` |
| `checks/contrast-check.js` | Text under 4.5:1 (3:1 large) on its real background, layers composited, both themes; gradients `UNKNOWN` | `Y2` |
| `checks/modal-check.js` | `SCROLL`, `SHIFT`, no focus taken, `BACKDROP`, Escape cancelled, focus not returned | `N1` |
| `checks/focus-check.js` | `NOFOCUS`, `WEAK` (under 3:1), `tabindex` above 0, unreachable by keyboard. Needs the page focused | `A` |
| `checks/motion-check.js` | `ALL`, `EASEIN`, `LAYOUTPROP`, `SCALE0`, `ORIGIN`, `NOPRESS`; no reduced-motion query is an advisory | `M1` `M3`-`M5` |
| `checks/diagram-check.js` | `BUDGET`, `DIAGONAL`, `CORNER`, `STACKED`, `SHARED PORT`, `BEHIND BOX`, `LABEL ON LINE`, `LABEL GAP`, `PLATE UNDER BOX`, `KEY INSIDE`, `SHRUNK`, `PAGE SCROLL`, `CLIPPED`, `NO CUE`, `NO NAME`, `DUP ID`, `EMPHASIS`. Wide width and 375px | `G1`-`G10` |
| `checks/form-check.js` | No label, phone or email typed as text, error while typing, no nudge on a required field, refused submit not landing on the first empty field. Types: reload after | `F1` `F2` |

## Without a browser window: `scripts/run-checks.py`

```bash
python scripts/run-checks.py page.html                         # all ten, at 1280px (large work only)
python scripts/run-checks.py page.html --checks table-check,popover-check --width 390
```

Headless Chrome on a local HTML file (needs only Python and Chrome); exits 1 if any check
fails, so a generated page can be checked in a script or pre-commit step. One width per run.

## What these cannot measure

Whether an error says what to do next, a button names its action, an empty state says how to start, or a
delete confirmation names its target: words, not geometry. `../kz-judge/` judges those with a small decision
model, if one is available, and costs the agent no tokens.

## Running them

- A page with a table is done only when `table-check.js` (and `popover-check.js` for its
  panels) ran in a real browser and its output is in the report - generated and static pages
  too; a reviewer reads the output, not the wording.
- One at a time, on a settled page; colour checks in both themes; 375px with touch is never
  skipped (the only width that exercises 44px targets and finds typing defects).
- A clean result on a page you have not seen render means the instrument is broken (zero-width
  viewport, a surface that never painted). Served and `fetch`ed: bust the cache (`?t=` plus
  the time), or an edited check reports on the old copy.
- Instrument traps (hidden tabs, mid-transition colours, synthetic events), the cache-bust
  snippet, the full-close-out widths and the two checks deliberately not shipped:
  `references/running.md`.
