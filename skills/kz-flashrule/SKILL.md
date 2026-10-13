---
name: kz-flashrule
description: One-page digest of the most critical rules across the kz skillset - the safety floor, data and destructive actions, tables, forms, overlays, layout and theming, the charts that get misread, and asking the user - each line a rule ID, the rule in a few words and the fastest check for it (a kz-uicheck script and its finding code, or one manual step). For a fast rule check of finished work in one read, not a copy of every rule. Use before calling work done, in step three of kz-fastfix, or when a full review is too heavy. The source rule always wins. Triggers on "/kz-flashrule", "flash rule", "fast rule check", "critical rules", "quick check".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-flashrule

The rules that break worst when missed, in one read. A summary only: the source rule wins, so always cite its ID.
A line fails or is unclear -> open the full rule in [ui-rules.md](../kz-uiuxrule/rules/ui-rules.md), [chart-rules.md](../kz-uiuxrule/rules/chart-rules.md) or [engineering-rules.md](../kz-engrules/rules/engineering-rules.md). A screenshot only -> [ui-glance](../kz-uiuxrule/skills/ui-glance/SKILL.md).
Checks in backticks are [kz-uicheck](../kz-uicheck/SKILL.md) scripts: one at a time, on a settled page, at a wide width, a narrow one and 375px with touch, colour checks in both themes.

## Safety floor and code (engineering rule numbers)

| ID | Rule | Fast check |
|---|---|---|
| 26 | Never simplify away validation at trust boundaries, data-loss handling, security or accessibility basics. | The diff removes no guard, check or try/catch; a secret scan of the staged diff is clean. |
| 2 | Never invent APIs, files, functions, behaviour or test results. | Grep every name you cite; every "passes" has its output beside it. |
| 11 | Trace every caller before editing a shared function; fix the shared path once. | Grep the function name; each caller still gets what it relied on. |
| 29 | Non-trivial logic leaves one runnable check that fails if the logic breaks. | A test runs the changed branch; a pure wording or style change needs none. |
| 29a | A check has to be shown failing before it is trusted. | Break what it guards, watch it go red, put it back. |
| 29b | Make sure the run used the file you just edited, not a cached copy. | Cache-bust (`?t=` plus the time), or assert on text only the new version holds. |
| 32a | A scripted edit asserts its match count and fails loudly on no match. | The script prints and asserts how many replacements it made; re-run the file after. |
| 29c | Every cross-reference resolves: rule IDs, links, tokens, icons, element ids. | `layout-audit.js` `UNDEFINED TOKEN`; grep each cited ID and link target. |
| 7 | ASCII only in source and docs: no em dash, curly quote, arrow or glyph. | `grep -nP '[^\x00-\x7F]'` on the changed files finds nothing. |
| 8 | No AI attribution anywhere: no AI co-author, trailer or "Generated with". | `git log -1 --format=%B` and the diff name no AI, tool or model. |
| 32 | Final review: no placeholder, TODO, skipped test or stray debug output left. | Grep the diff for `TODO`, `FIXME`, `.skip`, `.only`, `console.log`. |
| 33 | Branch named after the work (`feat/`, `fix/`, `docs/`, `chore/`), never a tool, model, agent or session name or id (`claude/...`, `ai-...`), even when a host assigns one; never push to `main`. | `python scripts/check-branch.py` prints ok. |
| 33a | Author and committer are the connected git account, read at commit time - never hard-coded, never the tool's default. | `gh api user` (or `get_me`) login and email match every line of `git log origin/main..HEAD --format='%an <%ae> \| %cn <%ce>'`. |
| 33c | Merge, remote branch delete and force-push only on the owner's explicit say-so. | The task holds the owner's words for that branch or PR. |

## Data and destructive actions

| ID | Rule | Fast check |
|---|---|---|
| S2 | Every destructive action opens a confirm modal naming the target, with a labelled cancel. | Grep delete, remove, clear, reset, wipe: each opens it, a bulk one states the count; `window.confirm` count is 0. |
| F3 | Unsaved form work keeps a draft; a dirty sheet asks before closing; undo beside confirm. | Type, close the sheet -> asked; reload -> draft back; delete -> undo offered. |
| A1 | Every action that changes state, takes time or can fail says what happened. | Force a failure (offline, bad input): a visible message, never silence. |
| F9 | Enter moves to the next field; only the last submits; irreversible forms land on confirm. | `typing-check.js` `ENTER`. |

## Tables

| ID | Rule | Fast check |
|---|---|---|
| S1 | Search, sort on every column, a filter per column (a button opening a panel, T1; never a bare box or select in the head), a live count, a no-match state. | `table-check.js` `NOSORT`, `NOSEARCH`, `NOCOUNT`; sort a number column: 9 before 10. |
| T1 | A filter is a panel: sort, value list with counts, range. Never a text box. Start from `kz-uiuxrule/snippets/filter-table.html`. | `table-check.js` `BOX`. |
| T2 | Every column gets a filter, computed ones too; materialise the value onto the row. | `table-check.js` `NOFILTER`. |
| S1 | Totals come from source values, rounded once; a filtered footer totals only shown rows. | Filter the table: the footer equals the shown rows' sum; shares total 100.0%. |

## Forms and fields

| ID | Rule | Fast check |
|---|---|---|
| F1 | Required fields marked early, nudged on leave; a refused submit counts and lands on first. | `form-check.js` `REQMARK`, `NONUDGE`, `SUBMIT`, `NOCOUNT`. |
| F2 | Validate on blur, clear on input; the input type brings the right keyboard. | `form-check.js` `EAGER`, `TYPE`. |
| F6 | An amount field accepts arithmetic via a parser, never by executing the text as code. | Type `1200+50` -> `1250`, not `120050`; grep finds no `eval` or `new Function`. |
| F8 | Typing never rebuilds the field, moves its caret, moves it on screen or zooms. | `typing-check.js` `REBUILT`, `CARET`, `MOVED`, `ZOOM`, at 375px. |

## Overlays and navigation

| ID | Rule | Fast check |
|---|---|---|
| N1 | A modal locks scroll, focus and clicks behind it; Escape closes and returns focus. | `modal-check.js` `SCROLL`, `SHIFT`, `BACKDROP`, `ESCAPE`, `FOCUS`, `RETURN`. |
| N2 | Every panel closes by its trigger, an outside tap, Escape, and Done on touch. | `popover-check.js` `STUCK`, `OUTSIDE`, `ESCAPE`, `NODONE`. |
| N4 | Back and reload restore scroll, sort, filters, typed text; a pasted link opens it. | Set filters, go forward, come back, reload, paste the URL in a new tab. |

## Layout, theming and accessibility

| ID | Rule | Fast check |
|---|---|---|
| V3 | Verify the layout at wide, narrow and 375px with touch, not only behaviour. | `layout-audit.js` `OVERFLOW`, `CLIPPED`, `TEXT OVERLAP`, `SMALL TOUCH TARGET`. |
| Y2 | Text meets 4.5:1 (3:1 large) on its real background, in both themes. | `contrast-check.js` `LOW`, run in light and in dark. |
| X1 | Real buttons and links, visible focus, labels tied to inputs, sane tab order. | `focus-check.js` `NOFOCUS`, `WEAK`, `UNREACHABLE`, `TABINDEX`; `form-check.js` `NOLABEL`. |
| A4 | Ship loading, empty, error, partial, overflow and no-permission states. | Force 0 rows, a failed request and a slow one: never a blank area. |
| V1 | Paint aria-sort, counts and captions from the state, never from the handler. | Change the state by reset, keyboard and URL: every one follows. |

## Charts (only what causes a wrong reading)

| ID | Rule | Fast check |
|---|---|---|
| C2 | Chart, legend and totals redraw from the rows the table is showing. | Filter the table to one value: chart, legend and totals follow. |
| C3 | Every chart works at 0, 1 and all rows. | Filter to 0, then 1: an empty message, no `NaN`, no blank. |
| C6 | Amounts sum, balances take the last value, rates recompute from summed sources. | Work one bucket out by hand and compare. |
| C9 | A bar axis starts at zero; a cropped line axis says so. | Read the lowest tick of every bar chart. |

## Asking the user

| ID | Rule | Fast check |
|---|---|---|
| 3 | Ask only when blocked; otherwise state the assumption and continue. | Does the repo, the record or the request answer it? Then do not ask. |
| kz-askcard | One card per turn: 3 to 5 decisions, one recommended, custom open, a default each. | Count cards this turn (1); every line has a recommendation and a default. |

When every line passes, the work is fit to hand over for anything small; anything big still gets its full review.
