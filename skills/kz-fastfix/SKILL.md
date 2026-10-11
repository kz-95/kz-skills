---
name: kz-fastfix
description: The fast lane for small work - a six-line size test first, then the change made directly with no crew, no card and no ledger, checked once by the tests that touch it and the project's automatic safety checks, and reported in three lines. Leaves the lane the moment the job grows or a check fails twice. Use before opening kz-crew021 or kz-loopfix for a single task, and whenever a request is a quick fix, a typo, a wording or style change, a doc line or a one-line bug. Triggers on "/kz-fastfix", "fast fix", "quick fix", "small fix", "just fix it".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-fastfix

Most work is small. Sending a small job through a crew, a review loop and a ledger makes
it slow without making it safer: the extra steps check the paperwork, not the change. This
is the lane for small jobs. The size test decides, and nothing else does.

## Step one: the size test

A job is SMALL only if every line is true. One "no" sends it to the normal lane.

| | Test |
|---|---|
| 1 | It touches at most 3 files and about 50 changed lines, tests included. |
| 2 | It adds no dependency and changes no data shape, schema, API contract or file format. |
| 3 | It touches no money, sign-in, permission, secret, personal or cost data, and no security check. |
| 4 | It deploys, publishes, deletes or migrates nothing, and sends nothing off the machine. |
| 5 | The cause is known, or one read of the code finds it. |
| 6 | Nobody asked for a review, and the project's own rules do not require one for this file. |

Passes: a typo or wording change, a colour or spacing tweak, a doc line, a renamed label, a
one-line bug whose cause is plain, a guard a reviewer already pinpointed.

Fails: a price or cost calculation, a login change, a new field or table, anything a release
depends on as a whole, a fix that already failed once (that is `kz-loopfix`).

Unsure is a "no". Never argue a job into the fast lane.

## Step two: do it

1. Read the code the change touches and every caller of a function you edit. `kz-engrules`
   L1 still holds: understand first, then make the change.
2. Make the smallest correct change yourself. No subagent, no worktree, and no Ask Card
   unless a decision is genuinely missing (then one card, `kz-askcard`).
3. Non-trivial logic leaves one test that fails before the change and passes after
   (`kz-engrules` rule 29). A pure wording or style change needs none.

## Step three: check it, once

Run each in the foreground and read its exit code yourself:

- the tests for the files you touched and their direct callers, not the whole suite;
- the project's automatic safety checks, where it has them: secret scan, leak or permission
  tests, lint, type check. They take seconds and catch what a reviewer reading a diff misses;
- for anything that renders, the one `kz-uicheck` check that matches the change
  (`layout-audit.js` for spacing, `table-check.js` for a table, and so on), at one wide width
  and at 375px.

All green: done. A red you caused: fix it once and run again. Red a second time: escalate.

## Step four: close it

One commit holding the change and its record line together (the changelog or decision note,
if the project keeps one). Report in at most three lines: what changed (file:line), what was
checked (the exit codes), anything left open.

## Escalate, never stretch

Leave the fast lane at once, and say why in one line, when:

- the change grows past the size test while you work;
- a check fails twice;
- the cause turns out to be somewhere else, or bigger;
- it turns out to touch anything in tests 2 to 4.

Where it goes: inside a `kz-crew021` run, it becomes a dispatched task; a defect that came
back goes to `kz-loopfix`; anything else gets one builder and one separate reviewer. Never
finish a big job quietly inside the fast lane.

## What does not bend

The fast lane skips ceremony, never safety. The `kz-engrules` safety floor holds (validation
at trust boundaries, error handling that prevents data loss, security, accessibility basics),
and so do `S1` and `S2` for UI: a table still ships search, sort and the filter panel, and a
delete still asks first. No secret is printed, and nothing goes live without the user's yes.
