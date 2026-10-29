# Changelog

All notable changes to this repository. Format follows [Keep a Changelog](https://keepachangelog.com/); versions follow [Semantic Versioning](https://semver.org/). **Rule IDs are never renumbered**, so a rule cited in 0.1.0 means the same thing in every later version.

## [Unreleased]

### Changed
- **`kz-judge` uses Laya only.** The hosted Jev engine (TypeSafe, `TYPESAFE_API_KEY`) is removed, so no page text and no API key leave the machine; `--engine` takes `auto` or `laya`. The calibration fingerprint no longer includes a Jev model pin, so a cached calibration is redone once.

### Added
- **A benchmark of what the skills cost and buy** (`scripts/bench/`, results in `docs/benchmark.md`). Seven single-file HTML tasks, each run in a fresh headless Claude Code session on a named model (Sonnet 5.5 and Opus 5.5), with no skills, the skills installed, and each lane called by name, the old and new skills side by side. It records wall time, `tokens_total` and the CLI's cost estimate, scores every page with the kz checks at 1280px and 390px (failures introduced against the starter), a DOM rubric, axe-core and Lighthouse, and runs a blind pairwise screenshot judge. `scripts/bench/README.md` says how to run it again. Measured against no skills, `/kz-uiuxrule` went from 2.54x to 1.52x the time on Sonnet 5.5 and from 3.35x to 1.67x on Opus 5.5, with 0 check failures introduced where no skills introduced 50 and 55.
- **The speed contract** (`kz-skill`), and engineering rule `29e`: verification is proportional to the change. Size the change first: a trivial change goes to `kz-fastfix` with at most one named check; small and medium work reads `kz-flashrule` first and runs only the checks named for the change, once; only a project, an audit, "make it production" or a release takes the full path. Follow-ups stay light, nothing is written into the user's project unasked, and no question is asked unless the request is genuinely ambiguous.
- **`kz-flashrule` as the first read for small and medium UI work**, before `rules/INDEX.md` or any rule file; a full section opens only when one of its lines points there.
- **`CHARTBOX` (`table-check.js`)**: a chart or dashboard filter built as a select, a bare text box, or chips or inline tick boxes with more than six values, no count or no clear, and the `#t1-chart-filter` wrong/right sample on the reference page, with `rules-check.js` asserting that its wrong half still fails.
- **Review fixes from a real Windows run.** Skill frontmatter is strict YAML, so `npx skills add` finds all thirteen skills (two were skipped with a parse error), and `validate.py` now rejects frontmatter strict YAML would reject. The plugin install route is verified and documented. `llms.txt` and `sitemap.xml` are served by GitHub Pages, and validate keeps `docs/llms.txt` identical to the root copy. The reference page has one `<main>`, TechArticle JSON-LD, links home, h3 under its h2, a dark-theme `--on-accent` fix for accent buttons, and its jump nav no longer covers the cards, which `layout-audit.js` now reports as `COVERED`. Rule G8 asks a scrolling diagram to show a cue, checked as `NO CUE`. `validate.py` enforces ASCII in skills and scripts, and `run-checks.py` works when run as root.
- **Diagram rules `G1`-`G10`, in their own file** (`kz-uiuxrule`: 94 rules, 57 UI, 6 motion, 21 chart, 10 diagram). `rules/diagram-rules.md` is the one copy: the form comes from the question (G1), a budget of nine boxes, twelve lines and two emphasised things with a fixed cut order (G2), square routes that leave a box from an edge (G3), lines never stacked or sharing a port (G4), never behind a box (G5), a label beside its line on an opaque plate (G6), a key below the drawing (G7), a phone scrolls the drawing instead of shrinking it (G8), an accessible name (G9) and emphasis on one or two things (G10). Adapted in part from [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT). `rules/INDEX.md` routes diagram words to section G.
- **`diagram-check.js`** (`kz-uicheck`, now ten checks, and in `run-checks.py`'s default set): `BUDGET`, `DIAGONAL`, `CORNER`, `STACKED`, `SHARED PORT`, `BEHIND BOX`, `LABEL ON LINE`, `LABEL GAP`, `PLATE UNDER BOX`, `KEY INSIDE`, `SHRUNK`, `PAGE SCROLL`, `CLIPPED`, `NO NAME`, `DUP ID`, `EMPHASIS`, and a `TRIVIAL` advisory. It measures the diagram as drawn, after CSS and transforms, in the diagram's own units. Measured clean on the reference page and shown failing on a fixture for each code. Run on 207 diagram-design examples, it reports real defects by that project's own rules, and the false positives it raised there were fixed.
- **Section G on the reference page**: wrong/right samples for the diagram rules (`#g1-earn`, `#g3-lines`, `#g5-behind`, `#g6-labels`, `#g7-key`, `#g8-phone`, `#g2-budget`), with `rules-check.js` asserting that each wrong half still fails.
- **`kz-diagramrule`**, a lane that reads only `diagram-rules.md` and `diagram-check.js`, for work that is only a diagram. The router, `docs/how-they-fit.md`, `llms.txt` and `AGENTS.md` route to it.
- **README rewritten.** A hero GIF made with Remotion in `scripts/hero/`: a poster that is also frame 0 (what reduced-motion readers see), then T1, Y2, C5 and G6 each shown wrong, caught by `table-check.js`, `contrast-check.js` (both themes), `layout-audit.js` and `diagram-check.js` with their real output, fixed and clean, then a closing card that dissolves back into the poster; 1200x675, about 31.5 s, under 2MB, fonts bundled; a gallery of one right-hand sample per category, cropped from the live reference page; a "what loads when" table; "it's working if"; and "when not to use it".
- **`docs/reference/index.html`**, a small page that forwards to `ui-rules-visual.html`, so the published `reference/` address no longer returns 404.
- **Published-link check in `scripts/validate.py`.** Every `https://kz-95.github.io/kz-skills/<path>[#anchor]` link in a tracked `.md`, `.txt`, `.html` or `.json` file must name a file under `docs/` (a trailing `/` means `index.html`), and an anchor on an `.html` target must be an `id` in that file. Each broken link fails with its file and line.
- **`scripts/check-branch.py`, and rule 33 made explicit about hosts.** A branch name holds the work only: never a tool, model, agent, host or session name or id (`claude/...`, `codex/...`, `ai-...`, a generated word salad such as `modest-mccarthy-cgaoyu`). A host that assigns or instructs a generated branch is a default, not the owner's instruction, so it does not outrank the rule; the work moves to a correctly named branch before it is pushed. The check fails a missing `feat/`, `fix/`, `docs/` or `chore/` prefix, a non-kebab-case name, a tool name and a generated id, and CI runs it on every pull request. Shown failing on seven bad names (including the one this change was made on) and passing on four good ones.
- **Star history chart in the README.**
- **Motion rules in their own file, and `kz-motionrule`** (`kz-uiuxrule` 2.3.0: 57 UI rules, 6 motion rules). `rules/motion-rules.md` is now the one copy of the M rules: M1 moved there unchanged with the motion figures from Appendix Q, and five new rules join it - M2 (how often it is seen decides whether it moves), M3 (nothing enters from `scale(0)`; an anchored panel grows from its trigger), M4 (never `transition: all`, never ease-in), M5 (a press answers before the action does), M6 (once one tooltip is open, the next opens at once) - with named easing curves, stagger, press/release asymmetry, gesture and performance notes. `kz-motionrule` is a lane that reads only that file and the check, for work that only moves. The reference page gains section M with wrong/right samples for M2-M6, each wrong half asserted in `rules-check.js`.
- **`motion-check.js`** (`kz-uicheck`, now nine checks, and in `run-checks.py`'s default set): `ALL`, `EASEIN`, `LAYOUTPROP`, `SCALE0`, `ORIGIN`, `NOPRESS`, and a `NOREDUCE` advisory. Shown failing on a fixture with each defect and clean on its fixed twin, the reference page and `filter-table.html`.
- **`kz-judge`**: judges the K1 and S2 wording rules a script cannot measure (an error says what to do next, a button names its action, an empty state says how to start, a delete confirmation names its target) with Jev or a local Laya, so the agent spends no tokens on them. Each engine is asked only the questions it has passed on labelled examples: each text is judged in its own request; on 12 Oct 2026 Jev (`jev-1.13.0`) passed all four with good >= 0.90 and bad <= 0.17; Laya 0.3.20 passed none, so it is gated off until a later version passes. `--strict` exits 1 on findings and 2 when nothing could be judged. Skips cleanly when neither is present.
- **Rule `L11`, a sequence wraps only while all of it stays in view** (`kz-uiuxrule` 2.2.0, 58 UI rules). Items read in order - versions, steps, a timeline, kanban columns - may wrap while the whole sequence fits the area that shows it; when wrapping pushes later items out of sight, or the order is drawn as a line (`data-sequence="line"`), they go in one row that scrolls sideways, opens at the item that matters now and shows a cue that more is to the right. A short set that fits stays a grid, because a sideways row hides things too. Reported from a progress page whose version cards wrapped so the newest sat out of sight. `layout-audit.js` gains `WRAPPED SEQUENCE`: a marked container that wraps and is taller than the panel or window showing it, wraps while marked as a line, or overflows with nothing to scroll it. The reference page shows ten detailed versions wrapped out of a 300px panel (wrong), the same row opened at the version in progress (right), and six small cards that wrap and fit (also right, and passed by the check).
- **`kz-fastfix`**, the fast lane for one small job: a size test decides, then the change is made directly and checked once (see its `SKILL.md`). The router sends a passing job there first, and `kz-crew021` step zero hands a single small task to it instead of starting a run.
- **`kz-flashrule`**, the most critical rules of the whole set on one page (37 lines: the safety floor, data and deletes, tables, forms, overlays, layout and theming, misread charts, asking), each with its rule ID and the fastest check. A summary only; the source rule wins. `scripts/validate.py` now fails if it cites a rule ID that no rule file defines.
- **`PICKCLOSE` (`popover-check.js`)**: asserts a multi-select panel stays open when one of its own
  options is chosen, which `N2` already required and nothing checked. Taken with the region behind the
  panel scrolled first, because applying a choice can shrink that region and the scrollTop clamp which
  follows is dispatched as an ordinary scroll event a dismiss-on-scroll handler may act on; at
  scrollTop 0 nothing clamps and the failure is invisible. Proven on a fixture pair: it reports on a
  panel whose change handler dismisses it, and is clean on the same panel with that handler removed.
- **Appendix Z lesson 26**: never accept "clean" from a check that cannot say what it measured, and
  measure while the surface is painting - the same panel "closed on pick" in a hidden browser pane and
  stayed open with the pane visible, so the behaviour under investigation was an artifact of where it
  was measured.

- **Engineering rule `29d`:** a run leaves the project tree as it found it; tests write scratch data only in the OS temp folder and clean up on failure too.
- **Done condition for any page with a table:** `table-check.js` and `popover-check.js` run in a real browser, output pasted in the report, including generated and static pages. A filter is a button opening a panel, never a bare box or select in the header (`S1` line in `kz-flashrule` now says so).
- **`snippets/filter-table.html`** (in `kz-uiuxrule`): a dependency-free table to start from. Sort on every column, a filter button per column opening a panel, a live count, every way to close the panel; passes all eight checks at 1280px and 390px. Its header is updated in place, never rebuilt while a panel is open.
- **`scripts/run-checks.py`** (in `kz-uicheck`): runs the checks on a local HTML file in headless Chrome and exits 1 on a failure, for generated pages, static reports and pre-commit.
- **Checks wait on real timers when the page is visible** (so headless virtual time works) and on a message channel when it is hidden.
- **`run-checks.py` gives every check a fresh page load**, so a check that opens panels or edits fields cannot leave state for the next one: run after `rules-check.js` in the same load, `popover-check.js` had reported `PICKCLOSE` on panels that pass alone. A page can no longer read other local files unless `--local-fetch` is given.
- **`run-checks.py` runs both colour schemes by default** (`--scheme both|light|dark`): a colour verified in one says nothing about the other.
- **`modal-check.js` reports `UNTESTED`** when a modal on the page was never opened because no opener could be found, instead of printing "clean (0 modals)". It also finds openers by `commandfor`.
- **`kz-uiuxrule` treats generated pages as UI**: its description names reports, progress pages, exports and anything a script writes; its verify step gives the `run-checks.py` command; the filter-table snippet carries that command at the top, where an agent adapting it will see it. Measured with five agent runs on the same brief: bare filter boxes in the first two, clean pages from the third, and the agent ran the checks itself only once the command sat in the snippet.

### Changed
- **SKILL.md files compressed, with on-demand `references/` files.** Detail a run needs only in one mode or phase (`kz-uiuxrule/references/modes.md`, `kz-uicheck/references/`, `kz-loopfix/references/`, `kz-crew021/references/`) is read when that part starts, so a small change no longer pulls in the rule slices.
- **The purpose hook is no longer mandatory.** For `kz-uiuxrule` it repeats the size test and asks only when the mode or scope is genuinely unclear; the skills carry the same text, so nothing depends on wiring it.
- **`T1` covers chart and dashboard filters**, and allows visible chips for up to six values, outside a table's header row, when they show what is on, carry a count and offer a one-tap Clear or All; past six values, or when the values come from the data and can grow, it is the panel.
- **The fast lanes run only the named check.** `kz-fastfix` and `kz-flashrule` run the one check named for the change, as a single check file or `run-checks.py --checks <that one>`; never `run-checks.py` without `--checks`, and no harness, test or scratch copy of their own.

### Fixed
- **Agents built chart filters as chips or selects.** In the first benchmark, all twelve Sonnet 5.5 chart-filter runs, with or without the skills, built the site filter as inline chips or tick boxes; `T1` now names chart and dashboard filters and `CHARTBOX` fails them.
- **A one-line edit ran the full check suite.** On Opus 5.5 a label change ran all the checks at two widths, about 28 s of a 44 s run; the speed contract gives a trivial change at most one check, and a fix re-runs only the check that failed.
- The README claimed 3 console checks; `kz-uicheck` has ten.
- The chart carousel's alt text in the README now matches what the GIF shows.
- **The M3 sample's right-hand menu did not open on its button**, which is what M3 asks: it was placed from the sample's padding edge, 16px left of the Options button and over its bottom edge (by 4px at 1400px, by 16px at 375px). Both menus now hang from a wrapper around their button, left edges aligned and 4px below it, and `rules-check.js` asserts that the right menu does; the new assertion failed on the old page. The README gallery's motion and diagram pictures were re-shot from the current page.
- **`rules-check.js` read the N2 Done button while its panel was still scaling in**, so at 375px with touch a 44px button measured 43.3px and failed. It now reads the untransformed height, and still fails on a Done button under 44px.
- The reference page's own button tooltips waited 400ms on every hover (M6); they now open at once while one is showing.
- The reference page honoured reduced motion with `transition: none` on everything, deleting the feedback (M1); it now keeps fades and colour changes and drops the travel.
- `snippets/filter-table.html` sort and filter buttons had no pressed state (M5).
- **A column filter panel dismissed itself when a value was picked after clearing the selection.**
  Reported on the reference page's revenue table: clear the selection, tick the first value, and the
  panel vanished without Done, Escape or an outside tap. Clearing empties the table, the card collapses
  (scrollHeight 495 to 157), the page reflows and scrolls, and the dismiss-on-scroll handler reads that
  reflow as a user scroll - confirmed by a stack trace showing `closeFilterPanel` called from the window
  scroll listener. The panel now follows its trigger on scroll and closes only when the trigger leaves
  the viewport, which also removes the sibling cases (its own list scrolling, a resize, a sticky header
  settling). `N2` states it and Appendix J documents the mechanism.
- **`popover-check.js` was reporting panels it had not tested.** It resolved its subject with a
  visibility test that rejects `opacity: 0`; a panel that fades in is laid out at opacity 0 for the
  length of its transition, so no panel was found, and with no panel the Escape, outside-click and
  `NODONE` routes were skipped rather than failed. Seven filter panels on the reference page printed
  `clean (7 triggers)` without being exercised. Panels are now resolved with a predicate that ignores
  opacity. Known limit: a panel parked at opacity 0 while closed is laid out even when closed, so the
  open/closed diff still cannot see it, and such triggers are skipped as before.


## [0.1.0] - unreleased

First public release.

### Added
- **Eight skills**, each a direct child of `skills/`: `kz-skill` (router), `kz-uiuxrule`, `kz-uicheck`, `kz-engrules`, `kz-askcard`, `kz-crew021`, `kz-loopfix`, `kz-reflect`; plus `ui-glance`, a child of `kz-uiuxrule`.
- **56 UI rules, 21 chart rules and 16 principles**, stack-neutral and style-neutral, each with the failure it prevents and the check that catches it. 26 lessons in Appendix Z, each a habit to have.
- **Eight console checks that run on any page** (`kz-uicheck`): `layout-audit.js`, `table-check.js`, `typing-check.js`, `popover-check.js`, `contrast-check.js`, `modal-check.js`, `focus-check.js`, `form-check.js`. Each was proven to fail on a wrong sample before it was trusted.
- **`kz-reflect`**, the self-improving loop: records a verified mistake, classifies it into one of seven outcomes (strengthen a summary, clarify a rule, new rule, new check, and so on), and proposes the change for a person to approve. Never edits a shared rule itself.
- **Reference page** with a wrong and a right sample for each rule, and two checks bound to it (`rules-check.js`, `state-check.js`).
- **Rules**
  - `T1`, `S1`: a column filter is a panel, never a bare text box; title and filter rows are one header block, one line under the filters.
  - `C5`: a highlight follows the mark's own outline; two-tone ring, asserted in both themes.
  - `B4`: everything that acts answers the pointer with one halo, on state and never at rest.
  - `F4`-`F8`: field shape, select on entry for digit-only fields, arithmetic in amount fields, one anchored pattern per field, typing never interrupted.
  - `F9`: Enter or Tab moves to the next field, unless the step is sensitive and wants a deliberate confirmation.
  - `N2`: every panel can be closed by every route (its own trigger, an outside tap, Escape, a visible Done on touch). Reported from a screen recording where a filter panel could not be closed on a phone.
- **Checks**
  - `table-check.js`: `BOX`, `NOFILTER`, `NOSORT`, `FILTERGAP`, plus advisories for search, live count and header explainers.
  - `layout-audit.js`: `FOCUS BOX` (a focus ring that is a bounding box on an SVG shape) and `UNDEFINED TOKEN` (a `var(--x)` nothing defines).
- **Lesson 26 / `N2`:** a column-filter panel must not be dismissed by a scroll the filter itself caused (a table that shrinks reflows the page); reposition on scroll instead of closing. `popover-check.js` gains `PICKCLOSE` (a multi-select that closed on choosing one of its values).
- **Licence:** Apache-2.0 with the Commons Clause. Free to use, modify and use commercially; the software itself may not be sold, including hosting or consulting/support fees whose value derives substantially from it.
- **Precedence over style skills:** `kz-uiuxrule` outranks a style or design skill such as impeccable. The style skill decides what the rules leave open; where they conflict, the rule wins. See `docs/with-impeccable.md`.
- Plugin manifest (`.claude-plugin/`), `AGENTS.md`, `llms.txt`, generated `docs/rule-index.md`, and `scripts/validate.py`.

### Known limits
- The plugin manifest has not been installed from GitHub yet; manual install is the verified path.
- The purpose hook (`kz-askcard`) is not wired by the plugin and has only been tested on Claude Code.
