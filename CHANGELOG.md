# Changelog

All notable changes to this repository. Format follows [Keep a Changelog](https://keepachangelog.com/); versions follow [Semantic Versioning](https://semver.org/). **Rule IDs are never renumbered**, so a rule cited in 0.1.0 means the same thing in every later version.

## [0.1.0] - unreleased

First public release.

### Added
- **Eight skills**, each a direct child of `skills/`: `kz-skill` (router), `kz-uiuxrule`, `kz-uicheck`, `kz-engrules`, `kz-askcard`, `kz-crew021`, `kz-loopfix`, `kz-reflect`; plus `ui-glance`, a child of `kz-uiuxrule`.
- **56 UI rules, 21 chart rules and 16 principles**, stack-neutral and style-neutral, each with the failure it prevents and the check that catches it. 25 lessons in Appendix Z, each a habit to have.
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
