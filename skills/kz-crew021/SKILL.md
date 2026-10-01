---
name: kz-crew021
description: Run a project from idea to maintenance with a costed multi-agent crew. Five phases with rigor that scales per phase, one scope relay, one Ask Card, a PoC spike with kill criteria before any fan-out, contract-first parallel build in worktrees, a scripted dispatch pipeline with six gates including a token budget gate, a single scribe for shared docs, and a per-session retro that feeds velocity back into planning. Triggers on "/kz-crew021", "crew project", "build this project", "plan and build", "run the crew".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# Crew Project

Runs a whole project. Frontier models think, low-tier models do, and scripts do
everything that needs no judgment at all.

The entire workflow is in `references/`. Read the one you need, when you need it
- not all of them up front.

| File | Read it when |
|---|---|
| `references/01-lifecycle.md` | Starting, or deciding whether a phase is done |
| `references/02-kickoff.md` | At the start: scope relay -> Ask Card -> PoC spike -> contracts |
| `references/03-dispatch.md` | Every time you hand a task to an agent |
| `references/04-team.md` | Picking who does a task and at which tier |
| `references/05-doc-ownership.md` | Anything writes a file |
| `references/06-budget.md` | Sizing, the budget gate, and the end-of-session retro |
| `references/07-progress.md` | Closing a slice, or blocking a task: the dashboard and how a blocker reaches a human |

## Step zero: ask what this run is for

**Before dispatching, planning or writing anything, ask the user what this run is** - one
Ask Card, then work. This workflow spends a budget across a crew; pointing it at the wrong
thing is the most expensive mistake available here.

1. What is this run - new project, continuing one, a single task, or a retro?
2. Which phase?
3. Budget, which sets the gate and not just the report?
4. Weight - fast (one attempt per task) or right (reviews and the fix loop)?

**Look before you ask.** Run `pb.py ready` and read `.pb/` if it exists: a project already
under way answers the first two by itself. Ask only what the repo cannot tell you.

How the card is built - three to five decisions, the `(recommended)` mark with four words
of why, the custom option, the stated default on every line, one card per turn - is the
`kz-askcard` sibling skill. This crew uses its **decision-ledger** format: each answer
becomes a `D-id` in `Decisions.md`, and every task depending on that id is re-queued when
it changes. `references/02-kickoff.md` has the worked card.

If the work renders anything, the UI decisions go on this same card (next section), not a
second one.

`../kz-askcard/hooks/ui-rule-purpose.mjs` enforces this outside the document, for this
skill and `kz-uiuxrule`, on any host that can run a command before a skill call. Where no
hook is wired, this section is the requirement.

## The UI rules this crew builds under

Anything that renders - a screen, a component, a chart, the dashboard below - is built
and reviewed against the **`kz-uiuxrule`** skill (v2.1.0: 57 UI rules, 21 chart
rules, 16 principles), not against taste. Route with its `../kz-uiuxrule/rules/INDEX.md`: a task's own
words ("table", "form", "chart", "dark mode", "back button") name the two or three
sections that apply, and nothing else does. **The rules live in that skill, not here** -
a copy in this folder would drift, and a drifted rule is worse than none.

Two of its rules are never scoped out of a dispatch, at any phase, at any tier:

- **S1** - every table ships a search, sort on every column and a filter per column, with
  a live count and a distinct no-matches state. **A "filter" is the T1 panel** - a button
  per column that opens sort, a value list with counts and a range for numbers - never an
  empty text box under each header; title and filter rows are one header block, one line
  under the filters. Where row order is itself content, that order is the default and comes
  back in one click.
- **S2** - every destructive action is behind a confirm that names the target.

**Its modes map onto this crew's phases**, so nobody runs the wrong weight of review:

| Here | There | When |
|---|---|---|
| A UI task in the build lane | **mode 3, build** | The dispatch itself: route, build, leave a check |
| CR reviewing a UI task | **mode 2, review** | Findings by rule id with the measurement that proves each - not "looks cramped" |
| The preview review | **`ui-glance`**, its child skill | A screenshot, one pass, three to six findings. Cheap enough to run on every screen before the user sees it |
| A Must at Production, or a UI defect that came back | **mode 4, loop** | Three reviewers against a separate fixer. This is `kz-loopfix` with rule ids as the verdict criteria |
| Starting a project that has its own design rules | **mode 1, adopt** | Once, at kickoff: consolidate rather than overwrite, and the project's rules win |

**A UI task is not closed until the checks have run.** `../kz-uicheck/` is the close-out:
`layout-audit.js` at a wide width, a narrow one and 375px with touch; `table-check.js` on any
table; `typing-check.js` at phone width on any field; `popover-check.js`, `modal-check.js`,
`form-check.js`, `focus-check.js` and `contrast-check.js` where the work has a dropdown, modal, form,
control or text. The end-of-session retro hands every defect that came back to `../kz-reflect/`. CR runs
the same, and a finding without a measurement behind it is not a finding. Run them one at a
time, on a settled page.

**Do not ask its Ask Card and this crew's Ask Card separately.** They are the same
instrument. At kickoff, the UI decisions (which sections apply, fast or right) are lines on
the one card that already goes to the user.

A UI task's `--done-when` says which rules it was built against, and CR checks those
rather than reading the screen for vibes. **Read `../kz-uiuxrule/rules/ui-rules.md` Appendix Z before the
first UI task of a project**: twenty-five mistakes made while building the reference
implementation for these rules, each written as the habit that prevents it. They are the
ones that pass review - a green check that asserts the wrong thing, a measurement taken
from a hidden viewport or a surface that never paints a frame, a highlight always one
section behind, a rule cited from memory rather than measured.

Two of its later rules bite this crew in particular, because they are about the scaffolding
a project builds around itself: **`V3`** (verify the layout, not only the behaviour - at
every width the README names) and **`N4`** (coming back is a state: a filtered table that
resets on the way back throws away the work the user did). The rules are stack-neutral and
style-neutral, so they hold whatever the project's design system turns out to be - and where
the project has one, it wins (its precedence ladder says so).

## Sibling skill

`../kz-loopfix/` - a nested three-party fix loop for one broken thing:
critic <-> fixer until they agree, then a gatekeeper rules on whether what they
agreed is true, and a false ruling drops back into another critic-fixer loop.
Reach for it when a fix has already failed once and the cost of it failing again
is high - a Must at Production, a bug that came back, a security finding. It is
the most expensive thing here; at MVP the one-attempt rule stands instead.

`scripts/pb.py` does the zero-token work: ready queue, the six dispatch checks,
locks, done-when verification, secret scan, ledger, velocity, re-queue, phase
gate, session report. Never do by hand what it does. `pb.py selfcheck` proves
the gates still hold.

## The rule that makes this cheap

**Judgment is where money buys quality; typing is not.** Every decision below
falls into one of three buckets, and putting a task in the wrong bucket is the
single most expensive mistake in this workflow.

| Bucket | Work | Who |
|---|---|---|
| * frontier | brainstorm - plan - review - QA - architecture | TL - PM - BA - SA - CR - QA - SE |
| o low | execution - fix - debug - write the code | FE - BE - DB - DO - Uma - TW - RM - SR |
| * script | dispatch checks - merge - ledger - velocity - generated docs | `pb.py`, no model at all |

Two tiers. There is no "mid" - a third tier is a decision nobody can make
consistently, and check 4 rejects it.

Escalation is one-way and only on retry: first attempt at low tier, a failed
attempt goes frontier. Symptom patching by a low-tier retry is the risk. Rework
from a changed decision is *not* a failed attempt and does not escalate.

## Start here

1. `python scripts/pb.py init --phase initialize --budget <tokens>` in the
   **main repo root** - not inside an agent worktree. `.pb/` holds the locks,
   ledger and velocity that every lane shares; worktrees reach it with
   `PB_ROOT`. Commit it: the ledger is this workflow's only memory between
   sessions.
2. Read `references/01-lifecycle.md`, decide the phase.
3. Read `references/02-kickoff.md` and run the relay.
4. After the Ask Card, freeze scope with `pb.py musts F-001 F-004 ...` and check
   ownership with `pb.py owners list`.

Per task, in order: `dispatch` -> `start` -> *work* -> `verify` -> `done`
(or `fail`). `pb.py verify` is not optional - `done` refuses a task that has not
passed it. Blocked instead of done: `pb.py block <task> --why ... --step ... --step ...`,
which needs real instructions, not a status (`references/07-progress.md`).

At the end of every slice, and whenever something is blocked: `pb.py dashboard`. It
writes `progress.html` and `run.bat`, which is how a human sees where the project is
without reading a ledger.

## The roster is web-shaped

FE / BE / DB / DO, OpenAPI contracts, "routes render" - the crew and the
contract-first fan-out assume a web application. The *workflow* is
domain-neutral; the build lane is not. For anything else (firmware, a data
pipeline, a research deliverable), swap the build-lane agents and their path
globs in `references/04-team.md` and `05-doc-ownership.md`, and keep everything
else. If a domain has no artifact that plays the part `contracts/` plays, the
parallel fan-out is the piece that will not survive the translation.

## Human touchpoints - two to reach a reviewed MVP

Getting from an idea to a reviewed MVP interrupts the user exactly twice:

1. **The Ask Card** - after the PM/BA relay, one card carrying unresolved scope
   plus 3-5 blocking decisions.
2. **The preview review** - a running app plus the list of everything tagged
   ASSUMED.

Two more exist beyond that arc, and they are not questions:

3. **Kill notification** - if the PoC spike hits its kill criteria, the user is
   told immediately. A STOP, not a request for input.
4. **Release approval** - at Production only, before a release ships.

Four in total across a full lifecycle. The claim worth holding is the narrow
one: *nothing between the Ask Card and the preview review reaches the user.*

Everywhere else, a subagent that has a question **assumes, tags the assumption
`ASSUMED`, and keeps going**. Questions queue for the preview review. A build
that stalls on a question is a bug in this workflow.

## Never

- Never let an agent write a shared doc. Everything goes through `updates/` and
  the scribe. See `references/05-doc-ownership.md`.
- Never hand-edit a generated file (CHANGELOG, Index, ProgressTracker, types
  from `contracts/`, anything under `budget/`, `progress.html`).
- Never block a task without the steps that clear it. A status is not a handoff.
- Never ship UI judged by eye where `kz-uiuxrule` has a rule for it.
- Never dispatch two tasks whose write sets overlap.
- Never rewrite an estimate after the fact. The ledger keeps est beside actual.
- Never exit a loop on a round count. Exit on the gate.
