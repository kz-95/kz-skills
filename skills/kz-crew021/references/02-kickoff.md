# 02 - Kickoff - one relay, one Ask Card, a spike, then fan out

```
R1 PM-Paige drafts Purpose.md + Feature.md
      v
R2 BA-Baron critiques, PM-Paige answers        <- exactly one relay
      v
ONE Ask Card  < the user
      v
MVP decided -> PoC spike -> kill? -> STOP / pivot
                            v pass
                      SA-Silas writes contracts/
                            v
                      FORK | parallel build | MERGE
```

## R1 - PM-Paige drafts

`Purpose.md` (what this is for, who for, what success looks like) and
`Feature.md` (every candidate feature, tiered).

Feature tiers - PM-Paige owns them, BA-Baron critiques them:

| Tier | Test | Lands in |
|---|---|---|
| **Must have** | the MVP is pointless without it | MVP, capped at 7 |
| **Good to have** | missed after a week of use | Production (v1.x) |
| **Nice to have** | delight, nobody asks for it | Maintenance / backlog |

Entry format, one line per feature:

```
F-004 - Sign in [Must] - story - done when - depends D-003 - status
```

## R2 - BA-Baron critiques - one relay, then it ends

BA-Baron tags every entry with exactly one of:

`OK` - `UNCLEAR` - `DEMOTE` - `SPLIT` - `MISSING`

PM-Paige answers each tag with either `ACCEPT` or `KEEP: <reason>`. A `KEEP`
without a reason is not an answer.

**One relay. Not a conversation.** Anything unresolved after that single
exchange is not re-argued - it becomes a line on the Ask Card. Two agents
converging on their own is how Initialize quietly eats 20% of the budget.

## The Ask Card - the user's first and main touchpoint

One card. Never two, never a trickle of questions.

```
## Ask Card - <project>

### Unresolved scope
- <the items R2 could not settle, one line each, with both positions>

### Blocking decisions (3-5)
D-001 - <question>
        A) <option> - <consequence>
        B) <option> - <consequence>
        recommendation: <one>
...
```

Card rules - how many decisions, the `(recommended)` mark, the custom option, the
stated default - are in the `kz-askcard` sibling skill; this is its decision-ledger
format. What is specific here: every answer becomes a `D-id` in `Decisions.md`, and
every task that depends on a `D-id` is re-queued when it changes.

After the card is answered: **MVP decided**. Must list is frozen at <= 7.

## The PoC spike - before any fan-out

SA-Silas and BE-Bruno, on the single riskiest Must, throwaway code.

Write the kill criteria first, in `Decisions.md`, as falsifiable statements:

```
KILL if <specific measurable thing> is not true after <bounded effort>
```

Then run it. Three outcomes:

- **Pass** -> continue to contracts.
- **Kill criteria hit** -> STOP. The user is notified immediately. This is not a
  question and not a failure; it is the spike doing its job for ~10% of budget
  instead of discovering the same thing at 60%.
- **Hard cap reached without a verdict** -> treat as a kill. An inconclusive
  spike is a kill; "a bit more time" is how the cap stops meaning anything.

This is the single highest-leverage step in the workflow. Fanning out ten agents
onto an architecture nobody has tested is the most expensive way to be wrong.

## Contract-first, then fan out

SA-Silas writes `contracts/` - OpenAPI, shared types, schema - and owns it
alone. Everything downstream is generated from it or built against it.

Only then does the scheduler fork:

| Lane | Output |
|---|---|
| UX/UI-Uma | `Userflow.md` - `Design.md` |
| FE-Felix | FE skeleton against mocks |
| BE-Bruno | api skeleton |
| DB-Dana | `DataSchema.md` - migrations |
| DO-Dominic | repo - CI - preview environment |

Each lane is a background subagent in **its own worktree**. They run in parallel
because their write sets do not overlap - which is enforced by check 2, not by
good intentions. Merge is fast-forward, done by `pb.py`, and unlocks dependents.

Contracts first is what makes the parallelism real. Without it, five agents each
invent the same interface differently and the merge is the whole project again.

## While the build runs

Subagents do not ask questions. They assume, tag `ASSUMED`, append the
assumption to their own `updates/` file, and keep going. The queue is answered
in one pass at the preview review.

## The preview review - the user's second touchpoint

A running app plus the ASSUMED list. The user confirms or overturns each
assumption; overturns become `D-id` entries and `pb.py requeue` re-queues every
task that depended on them. Then the project enters Production.
