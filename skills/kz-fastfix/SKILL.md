---
name: kz-fastfix
description: "The fast lane for small work - a short size test first, then the change made directly with no crew, no card and no ledger, checked once by the tests that touch it and the project's automatic safety checks, and reported in three lines. Leaves the lane the moment the job grows or a check fails twice. Use before opening kz-crew021 for a single task, and whenever a request is a quick fix, a typo, a wording or style change, a doc line or a one-line bug. Triggers on \"/kz-fastfix\", \"fast fix\", \"quick fix\", \"small fix\", \"just fix it\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-fastfix

Most work is small, and a crew, a loop and a ledger make a small job slow without making it safer.

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

Passes: a typo or wording change, a colour or spacing tweak, a doc line, a renamed label, a
one-line bug whose cause is plain, a guard a reviewer already pinpointed.

Fails: a price or cost calculation, a login change, a new field or table, anything a release
depends on as a whole, a fix that already failed once, a table or delete that lacks `S1` or
`S2` (building those is not small).

Unsure is a "no". Never argue a job into the fast lane.

## Step two: do it

1. Read the code the change touches and every caller of a function you edit. `kz-engrules`
   L1 still holds: understand first, then make the change.
2. Run the touched tests once before the change. That is the baseline, and for new logic it
   is the "fails before".
3. Make the smallest correct change yourself. No subagent, no worktree, and no Ask Card
   unless a decision is genuinely missing (then one card, `kz-askcard`).
4. Non-trivial logic leaves one test that fails before the change and passes after
   (`kz-engrules` rule 29). A pure wording or style change needs none.

## Step three: check it, once

Run each in the foreground and read its exit code or finding count yourself:

- the tests for the files you touched and their direct callers, not the whole suite;
- the project's automatic safety checks, where it has them: secret scan, leak or permission
  tests, lint, type check. They take seconds and catch what a reviewer reading a diff misses;
- for anything that renders: `kz-uicheck`'s `layout-audit.js` plus each check that matches
  the change (`contrast-check.js` for a colour, `table-check.js` for a table, and so on), at a
  wide width, a narrow one and 375px with touch, colour checks in both themes. The
  `kz-flashrule` page is the one-read rule check to go with them.

All green: done. A red that was not in the baseline: fix it once and run again. Red a second
time: escalate. Nothing ran is not green: say so in the report.

## Step four: close it

Stage by path and read `git diff --cached` once: inside the size test, nothing stray, no
secret. One commit holding the change and its record line together (the changelog or
decision note, if the project keeps one), not on main, no push unless asked. Report in at
most three lines: what changed (file:line), what was checked (the results), anything left open.

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
