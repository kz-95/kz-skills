---
name: kz-fastfix
description: "The fast lane for small work, UI included - change a label, restyle a button, add a column, fix a colour or spacing, tweak this page, a typo, a doc line, a one-line bug. A short size test first, then the change made directly with no crew, no card, no ledger and no rule-corpus read, checked once by the one check or test that covers it, and reported in one to three lines. Leaves the lane the moment the job grows or a check fails twice. Use for any one-element or one-line change before kz-uiuxrule or kz-crew021. Triggers on \"/kz-fastfix\", \"fast fix\", \"quick fix\", \"small fix\", \"just fix it\", \"change the label\", \"restyle\", \"add a column\", \"tweak\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-fastfix

Most work is small, and a crew, a loop, a ledger or a rule-corpus read make a small job slow
without making it safer. This is the trivial lane of the speed contract (`../kz-skill/SKILL.md`,
engineering rule 29e): on the benchmark a one-line label change cost 2.4x with the full UI
skill and 5.1x on Opus, almost all of it reading and checks the change did not need.

**Hard rule for this lane.** Run only the one check named for the change, by pasting or running
that single check file (no browser window: `python ../kz-uicheck/scripts/run-checks.py page.html
--checks <that one> --width 375 --scheme light`); never run `scripts/run-checks.py` without
`--checks <that one>`, or all checks; never run checks the change did not touch. Label, text or
style -> none, or `contrast-check.js` (`--scheme both`) if a colour changed; table or column ->
`table-check.js`; filter or dropdown -> `popover-check`; form field -> `form-check`; diagram ->
`diagram-check`; layout, spacing, size or a new control -> `layout-audit.js` at 375px; a theme
toggle -> `contrast-check` both themes, then `layout-audit` at 375px for the toggle. Write no
harness, test or scratch copy of your own to check a page, in the project or a scratch folder.

## Step one: the size test

A job is SMALL only if every line is true. One "no" sends it out by the routes under
"Escalate".

| | Test |
|---|---|
| 1 | It touches at most 3 files and at most 50 changed lines, tests included (the record line from step four does not count). |
| 2 | It adds no dependency and changes no data shape, schema, API contract, exported signature, return shape or file format. |
| 3 | It changes no logic that computes, stores or sends money, sign-in, permission, secret, personal or cost data, and no validation or security check. A label, colour or layout change on such a screen is fine. |
| 4 | The code it changes does not delete, overwrite or migrate stored data, and no build, CI, deploy or env file is touched. Nothing is published or sent off the machine. |
| 5 | The cause is known, or one read finds it, and no earlier fix for it has failed. |
| 6 | Nobody asked for a review, and the project's own rules do not require one for this file. |
| 7 | No `kz-crew021` run is under way (`.pb/` with tasks in flight). If one is, the job goes in as a task. |

Passes: a typo or wording change, a renamed label, a restyled button, a colour or spacing
tweak, a column added to a table that already meets `S1`, a doc line, a one-line bug whose
cause is plain, a guard a reviewer already pinpointed.

Fails: a price or cost calculation, a login change, a new field or table, anything a release
depends on as a whole, a fix that already failed once, a table or delete that lacks `S1` or
`S2` (building those is not small).

Unsure is a "no". Never argue a job into the fast lane.

## Step two: do it

1. Read the code the change touches and every caller of a function you edit. `kz-engrules`
   L1 still holds: understand first, then make the change.
2. Where the project has tests, run the touched ones once before the change: the baseline,
   and for new logic the "fails before". No test runner: build none.
3. Make the smallest correct change yourself. No subagent, no worktree, and no Ask Card
   unless a decision is genuinely missing (then one card, `kz-askcard`).
4. Non-trivial logic leaves one test in the project's own runner that fails before and passes
   after (`kz-engrules` rule 29). A wording or style change, or a project with no runner, none.

## Step three: check it, once

Run each in the foreground and read its exit code or finding count yourself:

- the tests for the files you touched and their direct callers, not the whole suite;
- the project's automatic safety checks, where it has them: secret scan, leak or permission
  tests, lint, type check. They take seconds and catch what a reviewer reading a diff misses;
- for anything that renders: the one check named in the hard rule above, or none. The rule is
  the one `kz-flashrule` line that applies; read nothing else. Never the full suite, and never
  a check script written into the project.

All green: done. A red that was not in the baseline: fix it once and re-run that check only.
Red a second time: escalate. Nothing ran is not green: say so in the report.

## Step four: close it

Stage by path and read `git diff --cached` once: inside the size test, nothing stray, no
secret. One commit holding the change and its record line together (the changelog or
decision note, if the project keeps one), not on main, no push unless asked. Report in one
to three lines: what changed (file:line), what was checked (the results), anything left open.

## Escalate, never stretch

Leave the fast lane at once, say why in one line, and leave the half-made change uncommitted
with its files named, when:

- the change grows past the size test while you work;
- a check fails twice;
- the cause turns out to be somewhere else, or bigger;
- it turns out to touch anything in tests 2 to 4.

Where it goes: a check that failed twice, or a defect that came back, goes to `kz-loopfix`;
inside a `kz-crew021` run it becomes a dispatched task; anything else gets one builder and one
separate reviewer. Never finish a big job quietly inside the fast lane.

## What does not bend

The fast lane skips ceremony, never safety. The `kz-engrules` safety floor holds (validation
at trust boundaries, error handling that prevents data loss, security, accessibility basics),
and so do `S1` and `S2` for UI: a table still ships search, sort and the filter panel, and a
delete still asks first. No secret is printed, and nothing goes live without the user's yes.
