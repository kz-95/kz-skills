# Changelog

All notable changes to this repository. Format follows [Keep a Changelog](https://keepachangelog.com/); versions follow [Semantic Versioning](https://semver.org/). **Rule IDs are never renumbered**, so a rule cited in 0.1.0 means the same thing in every later version.

## [Unreleased]

### Fixed
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

### Added
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
- **Licence:** Apache-2.0 with the Commons Clause. Free to use, modify and use commercially; the software itself may not be sold, including hosting or consulting/support fees whose value derives substantially from it.
- **Precedence over style skills:** `kz-uiuxrule` outranks a style or design skill such as impeccable. The style skill decides what the rules leave open; where they conflict, the rule wins. See `docs/with-impeccable.md`.
- Plugin manifest (`.claude-plugin/`), `AGENTS.md`, `llms.txt`, generated `docs/rule-index.md`, and `scripts/validate.py`.

### Known limits
- The plugin manifest has not been installed from GitHub yet; manual install is the verified path.
- The purpose hook (`kz-askcard`) is not wired by the plugin and has only been tested on Claude Code.
