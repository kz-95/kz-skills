---
name: kz-flashrule
description: "One-page digest of the most critical rules across the kz skillset - the safety floor, data and destructive actions, tables, forms, overlays, layout and theming, the charts that get misread, motion, diagrams, and asking the user - each line a rule ID, the rule in a few words and the fastest check for it (a kz-uicheck script and its finding code, or one manual step). The default first read for small and medium UI work, and a fast rule check of finished work, in one read; not a copy of every rule. Use before building a component or screen, before calling work done, in kz-fastfix, or when a full review is too heavy. The source rule always wins. Triggers on \"/kz-flashrule\", \"flash rule\", \"fast rule check\", \"critical rules\", \"quick check\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-flashrule

**The default first read for small and medium UI work** (speed contract, [kz-skill](../kz-skill/SKILL.md)): open a full section only when its "More:" line is needed or no line covers the work. Trivial work reads only the one line that applies.
The rules that break worst when missed; the source rule wins, so cite its ID. A screenshot only -> [ui-glance](../kz-uiuxrule/skills/ui-glance/SKILL.md).
**Hard rule for this lane.** Run only the one [kz-uicheck](../kz-uicheck/SKILL.md) check named for the change, by pasting or running that single check file (no browser window: `python ../kz-uicheck/scripts/run-checks.py page.html --checks <that one> --width 375 --scheme light`), once, on a settled page; never run `scripts/run-checks.py` without `--checks`, or all checks; never run checks the change did not touch. Label, text or style -> none, or `contrast-check` in both themes if a colour changed; table -> `table-check`; filter or dropdown -> `popover-check` (a chart filter -> `table-check`); form field -> `form-check`; diagram -> `diagram-check`; layout -> `layout-audit` at one width (375px). A new screen: the check for its kind, then `layout-audit` at 375px; nothing else. The "Fast check" column names what to look for, not checks to run; and write no harness, test or scratch copy of your own to check a page.

## Safety floor and code (engineering rule numbers)

More: [engineering-rules.md](../kz-engrules/rules/engineering-rules.md).

| ID | Rule | Fast check |
|---|---|---|
| 26 | Never simplify away validation at trust boundaries, data-loss handling, security or accessibility basics. | The diff removes no guard, check or try/catch; a secret scan of it is clean. |
| 2 | Never invent APIs, files, functions, behaviour or test results. | Grep every name you cite; every "passes" has its output beside it. |
| 11 | Trace every caller before editing a shared function; fix the shared path once. | Grep the function name; each caller still gets what it relied on. |
| 29 | Non-trivial logic leaves one runnable check that fails if the logic breaks. | A test in the project's own runner covers the changed branch; a pure wording or style change, or a project with no runner, needs none here. |
| 29e | Verification is proportional to the change; nothing written into the user's project unasked. | The checks run match what changed; after a fix only the failed one re-ran; the diff holds no unrequested file or feature. |
| 29a | A check has to be shown failing before it is trusted. | A check you write: break what it guards, watch it go red, put it back. Running a kz-uicheck script needs no break test. |
| 29b | Make sure the run used the file you just edited, not a cached copy. | Cache-bust (`?t=` plus the time), or assert on text only the new version holds. |
| 32a | A scripted edit asserts its match count and fails loudly on no match. | It asserts the replacement count; re-run the file after. |
| 29c | Every cross-reference resolves: rule IDs, links, tokens, icons, element ids. | `layout-audit.js` `UNDEFINED TOKEN`; grep each cited ID and link target. |
| 7 | ASCII only in source and docs: no em dash, curly quote, arrow or glyph. | `grep -nP '[^\x00-\x7F]'` on the changed files finds nothing. |
| 8 | No AI attribution anywhere: no AI co-author, trailer or "Generated with". | `git log -1 --format=%B` and the diff name no AI, tool or model. |
| 32 | Final review: no placeholder, TODO, skipped test or stray debug output left. | Grep the diff for `TODO`, `FIXME`, `.skip`, `.only`, `console.log`. |
| 33 | Branch named after the work (`feat/`, `fix/`, `docs/`, `chore/`), never a tool, model, agent or session name (`claude/...`, `ai-...`), even when a host assigns one; never push to `main`. | `python scripts/check-branch.py` prints ok. |
| 33a | Author and committer are the connected git account, read at commit time; never hard-coded or the tool's default. | `gh api user` (or `get_me`) matches every line of `git log origin/main..HEAD --format='%an <%ae> \| %cn <%ce>'`. |
| 33c | Merge, remote branch delete and force-push only on the owner's explicit say-so. | The task holds the owner's words for that branch or PR. |

## Data and destructive actions

More: [ui-rules.md](../kz-uiuxrule/rules/ui-rules.md) S2, F3, A1, F9.

| ID | Rule | Fast check |
|---|---|---|
| S2 | Every destructive action opens a confirm modal naming the target, with a labelled cancel. | Grep delete, remove, clear, reset, wipe: each opens it, a bulk one states the count; no `window.confirm`. |
| F3 | Unsaved form work keeps a draft; a dirty sheet asks before closing; undo beside confirm. | Type, close the sheet -> asked; reload -> draft back; delete -> undo offered. |
| A1 | Every action that changes state, takes time or can fail says what happened. | Force a failure (offline, bad input): a visible message, never silence. |
| F9 | Enter moves to the next field; only the last submits; irreversible forms land on confirm. | `typing-check.js` `ENTER`. |

## Tables

More: [ui-rules.md](../kz-uiuxrule/rules/ui-rules.md) T1-T4, Appendix A; start from `kz-uiuxrule/snippets/filter-table.html`.

| ID | Rule | Fast check |
|---|---|---|
| S1 | Search, sort on every column, a filter per column (the T1 panel, never a bare box or select), a live count, a no-match state. | `table-check.js` `NOSORT`, `NOSEARCH`, `NOCOUNT`; sort a number column: 9 before 10. |
| T1 | A filter is a panel: sort, value list with counts, range. Never a text box. Chart and dashboard filters too, never a select; chips only for up to 6 values with a count and clear. | `table-check.js` `BOX`, `CHARTBOX`. |
| T2 | Every column gets a filter, computed ones too; materialise the value onto the row. | `table-check.js` `NOFILTER`. |
| S1 | Totals come from source values, rounded once; a filtered footer totals only shown rows. | Filter the table: the footer equals the shown rows' sum; shares total 100.0%. |

## Forms and fields

More: [ui-rules.md](../kz-uiuxrule/rules/ui-rules.md) F1-F9.

| ID | Rule | Fast check |
|---|---|---|
| F1 | Required fields marked early, nudged on leave; a refused submit counts and lands on first. | `form-check.js` `REQMARK`, `NONUDGE`, `SUBMIT`, `NOCOUNT`. |
| F2 | Validate on blur, clear on input; the input type brings the right keyboard. | `form-check.js` `EAGER`, `TYPE`. |
| F6 | An amount field accepts arithmetic via a parser, never by executing the text. | Type `1200+50` -> `1250`, not `120050`; no `eval` or `new Function`. |
| F8 | Typing never rebuilds the field, moves its caret, moves it on screen or zooms. | `typing-check.js` `REBUILT`, `CARET`, `MOVED`, `ZOOM`, at 375px. |

## Overlays and navigation

More: [ui-rules.md](../kz-uiuxrule/rules/ui-rules.md) N1-N5.

| ID | Rule | Fast check |
|---|---|---|
| N1 | A modal locks scroll, focus and clicks behind it; Escape closes and returns focus. | `modal-check.js` `SCROLL`, `SHIFT`, `BACKDROP`, `ESCAPE`, `FOCUS`, `RETURN`. |
| N2 | Every panel closes by its trigger, an outside tap, Escape, and Done on touch. | `popover-check.js` `STUCK`, `OUTSIDE`, `ESCAPE`, `NODONE`. |
| N4 | Back and reload restore scroll, sort, filters, typed text; a pasted link opens it. | Set filters, go forward and back, reload, paste the URL in a new tab. |

## Layout, theming and accessibility

More: [ui-rules.md](../kz-uiuxrule/rules/ui-rules.md) L, Y, X, A and V sections.

| ID | Rule | Fast check |
|---|---|---|
| V3 | Verify the layout at wide, narrow and 375px with touch, not only behaviour. | `layout-audit.js` `OVERFLOW`, `CLIPPED`, `TEXT OVERLAP`, `SMALL TOUCH TARGET`. |
| Y2 | Text meets 4.5:1 (3:1 large) on its real background, in both themes. | `contrast-check.js` `LOW`, run in light and in dark. |
| X1 | Real buttons and links, visible focus, labels tied to inputs, sane tab order. | `focus-check.js` `NOFOCUS`, `WEAK`, `UNREACHABLE`, `TABINDEX`; `form-check.js` `NOLABEL`. |
| A4 | Ship loading, empty, error, partial, overflow and no-permission states. | Force 0 rows, a failed request and a slow one: never a blank area. |
| V1 | Paint aria-sort, counts and captions from the state, never from the handler. | Change the state by reset, keyboard and URL: every one follows. |

## Charts (only what causes a wrong reading)

More: [chart-rules.md](../kz-uiuxrule/rules/chart-rules.md) C1-C21.

| ID | Rule | Fast check |
|---|---|---|
| C2 | Chart, legend and totals redraw from the rows the table is showing. | Filter the table to one value: chart, legend and totals follow. |
| C3 | Every chart works at 0, 1 and all rows. | Filter to 0, then 1: an empty message, no `NaN`, no blank. |
| C6 | Amounts sum, balances take the last value, rates recompute from summed sources. | Work one bucket out by hand and compare. |
| C9 | A bar axis starts at zero; a cropped line axis says so. | Read the lowest tick of every bar chart. |

## Motion

More: [motion-rules.md](../kz-uiuxrule/rules/motion-rules.md) M1-M6, durations and curves.

| ID | Rule | Fast check |
|---|---|---|
| M1 | Motion explains a state change or is absent; reduced motion keeps the change; no layout properties. | `motion-check.js` `LAYOUTPROP`, `NOREDUCE`. |
| M3 | Nothing enters from `scale(0)`; a popover grows from the side facing its trigger. | `motion-check.js` `SCALE0`, `ORIGIN`. |
| M4 | Never `transition: all`, never ease-in on interface motion. | `motion-check.js` `ALL`, `EASEIN`. |
| M5 | Every button shows a pressed state while held, with no delay. | `motion-check.js` `NOPRESS`. |

## Diagrams

More: [diagram-rules.md](../kz-uiuxrule/rules/diagram-rules.md) G1-G10.

| ID | Rule | Fast check |
|---|---|---|
| G6 | A label sits beside its line on an opaque plate, 4px or more clear, never on the line. | `diagram-check.js` `LABEL ON LINE`, `LABEL GAP`. |
| G8 | A wide diagram keeps its native width on a phone and scrolls in its own box; never shrunk. | `diagram-check.js` `SHRUNK`, `CLIPPED`, at 375px. |

## Asking the user

More: [kz-askcard](../kz-askcard/SKILL.md).

| ID | Rule | Fast check |
|---|---|---|
| 3 | Ask only when blocked; otherwise state the assumption and continue. | Does the repo, the record or the request answer it? Then do not ask. |
| kz-askcard | One card per turn: 3 to 5 decisions, one recommended, custom open, a default each. | Count cards this turn (1); every line has a recommendation and a default. |

When every line that applies is met (read in the code; measured only by the checks the hard rule names), small and medium work is fit to hand over; large work still gets its full review.
