---
name: kz-loopfix
description: Nested three-party fix loop for one broken thing. A critic reviews and QAs and proposes fixes, a fixer verifies the critique and repairs it, and the two trade exchanges until the critic accepts - then a gatekeeper rules on whether what they agreed is actually true. A false ruling drops back into another critic-fixer inner loop. Cycles repeat until all three agree with evidence, then control returns to the orchestrator. Child skill of kz-skill, called by kz-crew021. Triggers on "/kz-loopfix", "loop fix", "fix it until it holds", "three party fix", "critic fixer gate".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-loopfix

Child skill of `kz-skill`, called by `kz-crew021`. Use it on **one** broken thing - a failing
task, a rejected review, a bug that came back - when "fix it and move on" has
already been tried once and did not hold.

Three parties, each with fresh context, each with a different job. Nobody
approves their own work.

| | Role | Who | Tier | Job |
|---|---|---|---|---|
| **A1** | Critic | CR-Cyrus + QA-Quinn, merged for the loop | * frontier | Review, QA, and propose fixes. Never edits. |
| **A2** | Fixer | the path owner (FE-Felix, BE-Bruno, ...) | o low -> * on escalate | Verify the critique, then repair. Only party that edits. |
| **A3** | Gate | TL-Theo | * frontier | Rules on whether A1 and A2's agreement is *true*. |

## The loop is nested

```
 open
   |
   v
+---------------- INNER LOOP - A1 <-> A2 -----------------+
|                                                        |
|   A1 critic --reject--> A2 fixer --> A1 re-review --+  |
|       ^                                             |  |
|       +---------------------------------------------+  |
|                    as many exchanges as it takes        |
+------------------------+-------------------------------+
                         | A1 accepts - A1 and A2 agree
                         v
                   A3 gatekeeper rules
                +--------+--------+
            FALSE               TRUE
                |                 |
   new inner loop on          all three agree
   what A3 says is wrong          |
   (next outer cycle)             v
                        hand back to the orchestrator
```

**Inner loop** - A1 and A2 trade exchanges until the critic accepts. One
exchange or seven; the length is whatever the defect needs. Every fix is
re-reviewed, always.

**Outer cycle** - one completed inner loop plus one ruling. A FALSE ruling does
not go back to the gate; it drops back down into a *fresh inner loop*, seeded
with what A3 said was wrong. Then A1 and A2 grind again, for however long that
takes, and it comes back up.

Cycles repeat until the gate rules TRUE. **The exit is the ruling - never an
exchange count and never a cycle count.**

## Why three and not two

A1 and A2 converging proves only that they converged. A critic who proposed a
fix has an interest in that fix being right, and a fixer who implemented it has
a bigger one - by the time they agree, both are invested in the same story. A3
never proposed anything and never wrote anything, so it is the only party that
can be wrong for free.

A3's question is not "is this good?" It is: **"is what these two agreed on
actually true?"**

## Run it

```bash
python ../kz-crew021/scripts/pb.py loop open T-07 --scope "auth refresh drops the session"
```

Then one exchange at a time. `pb.py` knows whose turn it is - it refuses a
verdict out of order, so the nesting cannot be skipped by accident:

```bash
# cycle 1, inner loop
pb loop round T-07 --agent critic --verdict reject \
    --findings "refresh token is compared before it is decoded" \
    --evidence "pytest tests/test_auth.py::test_refresh - fails, line 88"
pb loop round T-07 --agent fixer  --verdict accept \
    --findings "decode first, then compare; added the failing case as a test" \
    --evidence "pytest tests/test_auth.py - 14 passed"
pb loop round T-07 --agent critic --verdict accept \
    --evidence "re-ran the suite and read the diff; the compare is now post-decode"

# A1 and A2 agree - the gate rules, and rules FALSE
pb loop round T-07 --agent gate --verdict reject \
    --findings "three sibling call sites still compare pre-decode" \
    --evidence "grep -n 'compare(' auth/ - 3 other callers on the old path"

# cycle 2 opens automatically; back into the inner loop, then up again
pb loop round T-07 --agent critic --verdict reject --findings "..." --evidence "..."
pb loop round T-07 --agent fixer  --verdict accept --findings "..." --evidence "..."
pb loop round T-07 --agent critic --verdict accept --evidence "..."
pb loop round T-07 --agent gate   --verdict accept \
    --evidence "reproduced on the parent commit, confirmed fixed, and all four "\
               "call sites now decode first"

pb loop status T-07
pb loop close  T-07 --tokens 84000
```

`loop status` prints the cycle, where the inner loop is, and whose turn it is.
`loop close` refuses until the gate has ruled TRUE. The record lives in
`.pb/loops/<task>.json` - the agreement is auditable, not a claim someone made
in a chat message.

## Rules that make it work

**Every verdict carries evidence.** A command that was run, a file and line that
was read, a failure that was reproduced. `--evidence` is mandatory and a verdict
without it is void. "Looks right to me" is not a verdict.

**A1 never edits.** The moment the critic patches something, there is no
independent review left and the loop degrades into one agent talking to itself.

**A2 verifies before it fixes.** A critique can be wrong. The fixer's first job
is to reproduce the finding; if it cannot, it returns `--verdict reject` with
the evidence of *non*-reproduction, and A1 either produces a repro or withdraws.
Fixing an imaginary bug is how a loop runs forever.

**A3 checks the claim, not the vibe.** The gate reproduces the original failure,
confirms the fix removes it, and looks for the same defect in every sibling
caller. A fix that repairs one call site while three others stay broken is a
FALSE ruling, not a partial pass - root cause, not symptom.

**Fresh context per party, every exchange.** A1 in cycle 2 should not be
carrying its own cycle-1 reasoning. Re-read the current state instead of
remembering what you concluded about the old one. This costs tokens and is the
point: a critic that remembers agreeing will agree again.

**A3 does not re-enter the inner loop.** The gate rules and leaves. If it starts
suggesting fixes it becomes a second critic, and there is nobody left above it.
Its FALSE ruling names *what is wrong*, not what to write.

**Escalate the fixer, not the critic.** If A2's fix is rejected twice, A2 goes
frontier for the next exchange. A1 and A3 are frontier throughout - the critique
and the ruling are exactly the judgment this workflow refuses to economise on.

## When the loop stops without a TRUE ruling

Three ways out, and all of them return to the orchestrator:

- **STALLED** - `loop status` flags it when the same finding survives three
  outer cycles. Nobody is learning anything; the loop is ritual now. Hand back
  with the transcript.
- **Circling** - six or more exchanges inside one inner loop without reaching
  the gate. A1 and A2 are negotiating rather than converging. Escalate the fixer
  to frontier; if the next inner loop circles too, hand back.
- **Budget** - the loop obeys check 6 like any other work. `loop status` warns
  as the accumulated cost approaches what is left; over it, the loop holds and
  the orchestrator decides whether the fix is worth the remaining budget.
- **Out of scope** - a round reveals the real defect is somewhere the loop was
  not opened on. Close it and open a new one. Do not let the scope drift; a loop
  whose target moves cannot ever satisfy its own exit condition.

A defect that needed a loop at all is a lesson: when it closes with a TRUE ruling, hand it to
`../kz-reflect/` so the rule, summary or check that let it through gets fixed, not just the instance.

A stalled loop is information, not a failure. Three parties failing to agree
after several evidenced cycles usually means the thing is under-specified - that
is a `D-id` for TL-Theo, not more cycles.

## Reading the shape of a finished loop

The cycle/exchange counts in `loop status` say what actually went wrong:

| Shape | What it means |
|---|---|
| 1 cycle, 2-3 exchanges | The defect was what it looked like. Normal. |
| 1 cycle, many exchanges | The fix was hard, the critique was right. Fine. |
| Many cycles, short inner loops | **A1 keeps missing things A3 catches.** The critic is reviewing too narrowly - usually the symptom, not the callers. |
| Many cycles, long inner loops | The defect is under-specified. Stop and write a `D-id`. |
| 2+ fixer rejects | The critique could not be reproduced. A1 is guessing. |

Long is not the problem. *Repeating* is.

## Cost

Honest: this is the most expensive thing in `kz-crew021`. Two frontier
agents plus a fixer, times however many rounds it takes. Use it where a wrong
answer is expensive - a Must at Production, a bug that has already come back
once, a security finding - and nowhere else. At MVP, one failed attempt is
logged and the run moves on; that is deliberate, and this skill does not
override it.

The round cost goes on the ledger via `loop close --tokens`, so it shows up in
the session report beside everything else. If the loop is where the budget
went, the report will say so.
