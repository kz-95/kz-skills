# 03 - Dispatch pipeline - Plan is the only step that costs a model

```
Ask Card answers +
Feature.md       +-> PLAN (TL-Theo, frontier) -> * ready queue -> * 6 checks
question queue   |      task DAG + SIZE                            v
contracts/       +                                          assigned agent
                                                            (own worktree)
                                                                  v
                             * merge (ff) <- verify (phase-gated) -+
                                  v              ^ fail -> retry (per phase)
                            unlock next wave -> scribe applies updates/
```

Everything marked * is `../scripts/pb.py`. The only LLM step in the loop is Plan.

## Plan - the one frontier step

TL-Theo turns the decided MVP into a task DAG and **sizes every task**:

| Size | Points |
|---|---|
| S | 1 |
| M | 3 |
| L | 8 |
| XL | 20 |

Points are for forecasting, not for pay. They exist so that `points x velocity`
gives a token estimate, which is what check 6 gates on. See `06-budget.md`.

## The task record

```
Task T-07 - FE skeleton
assignee:  FE-Felix          tier: low
feature:   F-004 (Must)
reads:     Index -> Design.md - Userflow.md - contracts/auth.yaml
writes:    app/ - components/            (lock set)
size:      M = 3 pts   est 36k tok       (3 x 12.1k velocity)
needs:     T-02, T-03, D-003             (D-003 changes => re-queued)
done when: routes render, lint + tests pass          * script
```

There are two tiers, `low` and `frontier`. There is no `mid`.

Three fields carry most of the weight:

- **`writes`** is the lock set. It is what makes parallel safe.
- **`reads`** is the context pack, and it is measured - see check 5.
- **`done when`** is a **shell command**, not a sentence. `pb.py verify` runs it
  and the merge is refused if it fails. "Looks right" is not a done-when; it is
  a QA task, which is a different and more expensive thing.

## Ready queue and priority score

A task is ready when every `needs` is merged and every `D-id` it depends on is
answered. Ready tasks are ordered by score:

```
+3  Must          +1 Good          0 Nice
+3  on the critical path
+2  per task it unblocks
+1  high risk (fail early)
-2  depends on an ASSUMED decision
```

The `-2` is deliberate: work built on an assumption is work that may be thrown
away at the preview review, so it goes last among equals.

## The six dispatch checks

`pb.py dispatch T-07` runs all six. Any failure holds the task; it does not
queue a human.

1. **Owner glob** - the assignee owns every path in `writes`, per the ownership
   map in `.pb/config.json`. `pb.py init` seeds it from the roster; extend it
   with `pb.py owners set "app/**" FE-Felix` or `pb.py owners import owners.txt`
   (one `<glob> <agent>` per line). An **empty map holds the task** rather than
   passing - a gate that passes when unconfigured is not a gate. See
   `05-doc-ownership.md`.
2. **Write-set lock free** - no in-flight task writes an overlapping path. This
   is the entire concurrency model; there is no merge-conflict resolution step
   because there are no merge conflicts.
3. **WIP cap** - bounded agents in flight. More parallel is not more throughput
   once every lane is waiting on the same merge.
4. **Tier** - `low` or `frontier` only, plus the escalation rule: attempt 1 at
   the task's tier, any later attempt must be `frontier`.
5. **Context pack** - assembled from `reads`, Index first, then direct deps
   only, and **measured**: the pack may not exceed 60% of the task's estimated
   input tokens (`est x 0.5`). Over that, or a `reads` entry that does not
   exist, holds the task. The pack is the biggest input-token lever in the whole
   workflow; in a measured session 31% of packed context was never referenced.
6. **Budget gate** - `06-budget.md`. The one check that can stop the project.

## Verify - gated by phase

| Phase | `pb.py verify` runs | `pb.py done` additionally requires |
|---|---|---|
| Initialize | nothing | - |
| PoC | `done_when` + secret scan | - |
| Pre-Production | `done_when` + secret scan | - |
| Production | `done_when` + secret scan | `--reviewed QA-Quinn CR-Cyrus` |
| Maintenance | regression command + secret scan | - |

The secret scan runs in every phase, including PoC. It costs nothing and catches
the one class of problem that is disastrous to find late - everything else
security-related is deferred to SE-Sera at Production on purpose.

`pb.py done` refuses an unverified task. `--force` exists for the case where the
check itself is broken; using it is a line in the session report, not a habit.

Spending review agents at MVP is the most common way this workflow gets
expensive without getting better. On failure, `pb.py fail` re-queues at frontier
or abandons, per the phase's attempt count - a retry escalates a tier rather
than repeating the same attempt.

## Merge and unlock

Fast-forward merge, done by script, which then:

- releases the write locks,
- unlocks every dependent task into the ready queue,
- appends one line to `budget/ledger.jsonl` (est beside actual),
- hands the batch of `updates/` records to TW-Tessa.

## Re-queue on a changed decision

When a `D-id` changes - most often at the preview review - run:

```bash
python scripts/pb.py requeue D-003
```

Every task that needs `D-003` goes back to the queue, merged or not, with its
attempt count **reset to zero** - rework caused by a decision change is not a
failed attempt, so it is not forced up to frontier tier and does not count
against the phase's attempts.

Rework is not a velocity problem and is never absorbed into the velocity number.
It is marked `rework_for` on the ledger line, excluded from the velocity roll,
cleared once that run is paid for, and reported separately as avoidable waste.

## Command order for one task

```bash
python scripts/pb.py dispatch T-07     # the six checks; non-zero exit = hold
python scripts/pb.py start T-07        # takes the lock, measures the pack
#   ... the agent does the work in its worktree ...
python scripts/pb.py verify T-07       # done_when + secret scan
python scripts/pb.py done T-07 --actual 41000
#   ... or, if it failed:
python scripts/pb.py fail T-07         # re-queue at frontier, or abandon
```
