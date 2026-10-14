---
name: kz-crew021
description: "Run a project from idea to maintenance with a costed multi-agent crew. Five phases with rigor that scales per phase, one scope relay, one Ask Card, a PoC spike with kill criteria before any fan-out, contract-first parallel build in worktrees, a scripted dispatch pipeline with six gates including a token budget gate, a single scribe for shared docs, and a per-session retro that feeds velocity back into planning. Triggers on \"/kz-crew021\", \"crew project\", \"build this project\", \"plan and build\", \"run the crew\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# Crew Project

Runs a whole project. Frontier models think, low-tier models do, and scripts do
everything that needs no judgment at all.

The workflow is in `references/`. Read the one you need, when you need it.

| File | Read it when |
|---|---|
| `references/01-lifecycle.md` | Starting, or deciding whether a phase is done |
| `references/02-kickoff.md` | At the start: scope relay -> Ask Card -> PoC spike -> contracts |
| `references/03-dispatch.md` | Every time you hand a task to an agent |
| `references/04-team.md` | Picking who does a task and at which tier |
| `references/05-doc-ownership.md` | Anything writes a file |
| `references/06-budget.md` | Sizing, the budget gate, and the end-of-session retro |
| `references/07-progress.md` | Closing a slice, or blocking a task: the dashboard and how a blocker reaches a human |
| `references/08-ui.md` | Before the first UI task, and when dispatching or reviewing one |

## Step zero: ask what this run is for

**First, is this a crew job at all?** This is the large path of the speed contract
(`../kz-skill/SKILL.md`). One task that passes the `../kz-fastfix/` size test is not a run: no
card, no `pb.py init`, no dispatch; hand it to that skill. Inside a run already under way,
tasks keep the pipeline: the locks and write-set checks make a parallel crew safe.

**Then, before dispatching, planning or writing anything, one Ask Card** - this workflow
spends a budget across a crew, so pointing it wrong is the most expensive mistake here:

1. What is this run - new project, continuing one, a single task (one that fails the
   `kz-fastfix` size test), or a retro?
2. Which phase?
3. Budget, which sets the gate and not just the report?
4. Weight - fast (one attempt per task) or right (reviews and the fix loop)?

**Look before you ask:** `pb.py ready` and `.pb/` answer the first two for a project under way.
The card's form is `kz-askcard`, in its **decision-ledger** format: each answer becomes a
`D-id` in `Decisions.md`, and every task depending on it is re-queued when it changes
(worked card: `references/02-kickoff.md`). UI decisions go on this same card, never a second.
`../kz-askcard/hooks/ui-rule-purpose.mjs` repeats this card on hosts that can run a command
before a skill call; where none is wired, this section is the requirement.

## The UI rules this crew builds under

Anything that renders is built and reviewed against `kz-uiuxrule` (57 UI, 6 motion, 21 chart,
10 diagram rules, 16 principles), routed by its `../kz-uiuxrule/rules/INDEX.md`, never copied
here. Two rules are never scoped out of a dispatch, at any phase or tier:

- **S1** - every table ships a search, sort on every column and a filter per column, with a
  live count and a no-matches state. **A "filter" is the T1 panel** (a button per column
  opening sort, a value list with counts, a range for numbers), never an empty text box under
  each header. Full wording: `references/08-ui.md`.
- **S2** - every destructive action is behind a confirm that names the target.

**A UI task is not closed until its checks have run** (`../kz-uicheck/`: the checks for what
it touched, the full set at the phase gate). How `kz-uiuxrule`'s modes map onto the
phases (build = mode 3, CR = mode 2, preview = `ui-glance`, a Must at Production = mode 4,
kickoff with existing rules = mode 1), the check list, Appendix Z (read before the first UI
task) and `V3`/`N4`: `references/08-ui.md`.

## Sibling skill and script

`../kz-loopfix/` - critic <-> fixer to agreement, then a gate rules whether it is true. For a
fix that already failed once where failing again is expensive (a Must at Production, a bug
that came back, a security finding). At MVP the one-attempt rule stands instead.

`scripts/pb.py` does the zero-token work: ready queue, the six dispatch checks, locks,
done-when verification, secret scan, ledger, velocity, re-queue, phase gate, session report.
Never do by hand what it does. `pb.py selfcheck` proves the gates still hold.

## The rule that makes this cheap

**Judgment is where money buys quality; typing is not.** A task in the wrong bucket is
the most expensive mistake in this workflow.

| Bucket | Work | Who |
|---|---|---|
| * frontier | brainstorm - plan - review - QA - architecture | TL - PM - BA - SA - CR - QA - SE |
| o low | execution - fix - debug - write the code | FE - BE - DB - DO - Uma - TW - RM - SR |
| * script | dispatch checks - merge - ledger - velocity - generated docs | `pb.py`, no model at all |

Two tiers, no "mid": a third tier is a decision nobody makes consistently, and check 4
rejects it. Escalation is one-way and only on retry: a failed low-tier attempt goes frontier
(a low-tier retry patches symptoms). Rework from a changed decision is not a failed attempt
and does not escalate.

## Start here

1. `python scripts/pb.py init --phase initialize --budget <tokens>` in the **main repo
   root**, not an agent worktree. `.pb/` holds the shared locks, ledger and velocity;
   worktrees reach it with `PB_ROOT`. Commit it: the ledger is the only memory between sessions.
2. Read `references/01-lifecycle.md`, decide the phase.
3. Read `references/02-kickoff.md` and run the relay.
4. After the Ask Card, freeze scope with `pb.py musts F-001 F-004 ...` and check
   ownership with `pb.py owners list`.

Per task, in order: `dispatch` -> `start` -> *work* -> `verify` -> `done`
(or `fail`). `pb.py verify` is not optional - `done` refuses a task that has not
passed it. Blocked instead of done: `pb.py block <task> --why ... --step ... --step ...`,
which needs real instructions, not a status (`references/07-progress.md`).

End of every slice, and whenever something is blocked: `pb.py dashboard` writes
`progress.html` and `run.bat`, so a human sees where the project is without a ledger.

## The roster is web-shaped

FE / BE / DB / DO, OpenAPI contracts, "routes render": the build lane assumes a web app; the
workflow is domain-neutral. For anything else (firmware, a data pipeline, research), swap the
build-lane agents and path globs in `references/04-team.md` and `05-doc-ownership.md`; with
nothing playing the part of `contracts/`, the parallel fan-out will not survive.

## Human touchpoints - two to reach a reviewed MVP

1. **The Ask Card** - after the PM/BA relay: unresolved scope plus 3-5 blocking decisions.
2. **The preview review** - a running app plus the list of everything tagged ASSUMED.

Two more exist beyond that arc, and they are not questions: a **kill notification** if the
PoC spike hits its kill criteria (a STOP, told immediately), and **release approval** at
Production only. Four in all; *nothing between the Ask Card and the preview review reaches
the user.* Elsewhere a subagent with a question **assumes, tags it `ASSUMED`, and keeps
going**; questions queue for the preview review. A build stalled on a question is a bug.

## Never

- Never let an agent write a shared doc: `updates/` and the scribe (`references/05-doc-ownership.md`).
- Never hand-edit a generated file (CHANGELOG, Index, ProgressTracker, types
  from `contracts/`, anything under `budget/`, `progress.html`).
- Never block a task without the steps that clear it.
- Never ship UI judged by eye where `kz-uiuxrule` has a rule for it.
- Never dispatch two tasks whose write sets overlap.
- Never rewrite an estimate after the fact. The ledger keeps est beside actual.
- Never exit a loop on a round count. Exit on the gate.
