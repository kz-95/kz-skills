# kz-crew021 - reference index

Six references plus one script. `SKILL.md` at the skill root is the router; read
it first, then come back here for the one you need.

| Document | Kind | Covers | Reach for it when |
|---|---|---|---|
| [01-lifecycle.md](01-lifecycle.md) | confirmed workflow rule | Five phases, the rigor table (scope - attempts - exit gate - verify - human - budget - crew per phase), phase notes, the exit gate's five checks | Starting a project, or deciding whether a phase is finished |
| [02-kickoff.md](02-kickoff.md) | confirmed workflow rule | R1/R2 scope relay, feature tiers, the Ask Card, PoC spike and kill criteria, contract-first fan-out, the preview review | At the start of a project, and any time scope moves |
| [03-dispatch.md](03-dispatch.md) | spec to build against | Task record, sizing, priority score, ready queue, the six dispatch checks, verify-by-phase, merge, re-queue, the per-task command order | Every time a task is handed to an agent - the most-read file here |
| [04-team.md](04-team.md) | confirmed workflow rule | The 10 agents, who joins at which phase, path ownership, the two-tier policy and the one-way escalation rule | Choosing who does a task and at which tier |
| [05-doc-ownership.md](05-doc-ownership.md) | confirmed workflow rule | Code-vs-shared-doc split, the `updates/` inbox, the scribe, the ten rules, the enforced ownership map | Anything is about to write a file |
| [06-budget.md](06-budget.md) | spec to build against | Points and velocity, check 6's three bands, the escalation ladder, the session report, the four levers, the guardrail | Sizing a phase, hitting the budget gate, or closing a session |

| [07-progress.md](07-progress.md) | spec to build against | The generated dashboard (`pb.py dashboard`), what it carries, and the rule that a blocked task ships the steps that clear it | Closing a slice, blocking a task, or when someone asks how far along the project is |

## Outside this folder

- `../../kz-loopfix/SKILL.md` - child skill, spec to build against. The
  nested critic <-> fixer <-> gate loop for one stubborn defect: the two inner
  parties iterate to agreement, the gate rules on whether that agreement is
  true, and a false ruling starts another inner loop. Reach for it when a fix
  has already failed once and failing again is expensive. Driven by
  `pb.py loop`, which enforces whose turn it is.
- `../scripts/pb.py` - the runnable half: ready queue, six checks, locks,
  done-when verification, secret scan, ledger, velocity, re-queue, phase gate,
  report. `python scripts/pb.py selfcheck` asserts the parts that rot silently:
  overlapping write sets never co-dispatch, an empty ownership map holds rather
  than passing, an oversized context pack holds, a retry cannot stay low-tier,
  rework never pollutes velocity or escalates a tier, an est is never rewritten,
  the phase gate catches an abandoned Must, and the loop-fix nesting holds (no
  ruling before the inner parties agree, no close before a TRUE ruling, a false
  ruling falls back to the critic).
Two of these live in the project this skill was written in, and an installed copy does
not carry them - the rules below stand without either:

- `../../../docs/history/diagrams/` (in the repository; an installed copy does not carry it) - the workflow diagram this skill was built from. The
  diagram is the source of record for the *shape*; these documents are the
  source of record for the *rules*.
- `../../../docs/history/SKILL-REVIEW.md` (in the repository; an installed copy does not carry it) - the review that produced the current version. Every
  material finding in it has been addressed; keep it as the record of why the
  workflow reads the way it does.
- State lives in the target project at its **main repo root**, not here:
  `.pb/config.json`, `.pb/tasks.json`, `.pb/budget/ledger.jsonl`,
  `.pb/budget/velocity.json`, and `updates/`. Worktrees reach it with `PB_ROOT`.

## Open questions

- **Pack measurement is bytes / 4**, not a real tokenizer. Good enough to gate
  on, but the number in the report is approximate - do not tune lever #1 to the
  third digit.
- **`overlaps()` compares literal glob prefixes.** Correct for the flat globs
  the roster uses; brace expansion or mid-pattern wildcards would need a
  plan-time path-set intersection instead.
- **The roster is web-shaped** (see SKILL.md). No translation of the build lane
  to non-web domains has been tried yet, and `contracts/` is the piece with no
  obvious equivalent outside API-shaped work.
- **`pb.py done --actual` is supplied by hand.** Nothing measures a subagent's
  real token spend, so the ledger is only as honest as whoever types the number.
  This is the weakest link in the whole budget loop.

Each document keeps its own open questions at its end.
