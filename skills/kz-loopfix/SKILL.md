---
name: kz-loopfix
description: "Nested three-party fix loop for one broken thing. A critic reviews and QAs and proposes fixes, a fixer verifies the critique and repairs it, and the two trade exchanges until the critic accepts - then a gatekeeper rules on whether what they agreed is actually true. A false ruling drops back into another critic-fixer inner loop. Cycles repeat until all three agree with evidence, then control returns to the orchestrator. Child skill of kz-skill, called by kz-crew021. Triggers on \"/kz-loopfix\", \"loop fix\", \"fix it until it holds\", \"three party fix\", \"critic fixer gate\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-loopfix

Child skill of `kz-skill`, called by `kz-crew021`. For **one** broken thing - a failing task,
a rejected review, a bug that came back - when "fix it and move on" was tried once and did
not hold. This is the large path of the speed contract (`../kz-skill/SKILL.md`): never for a
first attempt or small work, which go to `kz-fastfix`.

Three parties, each with fresh context and a different job. Nobody approves their own work.

| | Role | Who | Tier | Job |
|---|---|---|---|---|
| **A1** | Critic | CR-Cyrus + QA-Quinn, merged for the loop | * frontier | Review, QA, and propose fixes. Never edits. |
| **A2** | Fixer | the path owner (FE-Felix, BE-Bruno, ...) | o low -> * on escalate | Verify the critique, then repair. Only party that edits. |
| **A3** | Gate | TL-Theo | * frontier | Rules on whether A1 and A2's agreement is *true*. |

## The loop is nested

```
open -> INNER LOOP: A1 critic --reject--> A2 fixer --> A1 re-review --> ... until A1 accepts
     -> A3 gatekeeper rules
          FALSE -> a fresh inner loop on what A3 says is wrong (next outer cycle)
          TRUE  -> all three agree -> hand back to the orchestrator
```

**Inner loop** - A1 and A2 trade exchanges until the critic accepts; one or seven, whatever
the defect needs. Every fix is re-reviewed, always. **Outer cycle** - one inner loop plus one
ruling. A FALSE ruling drops into a fresh inner loop seeded with what A3 said was wrong.
**The exit is the ruling - never an exchange count and never a cycle count.**

## Why three and not two

A1 and A2 converging proves only that they converged: by the time they agree, both are
invested in the same story. A3 never proposed or wrote anything, so it is the only party that
can be wrong for free. Its question is not "is this good?" but **"is what these two agreed
on actually true?"**

## Run it

`python ../kz-crew021/scripts/pb.py loop open <task> --scope "..."`, then
`pb loop round <task> --agent critic|fixer|gate --verdict accept|reject --findings ... --evidence ...`
one exchange at a time (it refuses a verdict out of order), `pb loop status`, and
`pb loop close <task> --tokens <n>` (refused until the gate rules TRUE; the record is
`.pb/loops/<task>.json`). A full worked loop and how to read a finished one's shape:
`references/run.md`.

## Rules that make it work

- **Every verdict carries evidence** - a command run, a file and line read, a failure
  reproduced. `--evidence` is mandatory; "looks right to me" is not a verdict.
- **A1 never edits.** Once the critic patches, there is no independent review left.
- **A2 verifies before it fixes.** If it cannot reproduce the finding it rejects with the
  evidence of non-reproduction, and A1 produces a repro or withdraws. Fixing an imaginary bug
  is how a loop runs forever.
- **A3 checks the claim, not the vibe.** It reproduces the original failure, confirms the fix
  removes it, and looks for the same defect in every sibling caller. One call site fixed while
  three stay broken is FALSE, not a partial pass.
- **Fresh context per party, every exchange.** Re-read the current state; a critic that
  remembers agreeing will agree again.
- **A3 does not re-enter the inner loop.** Its FALSE ruling names *what is wrong*, not what to
  write; a gate that suggests fixes is a second critic with nobody above it.
- **Escalate the fixer, not the critic.** A2's fix rejected twice -> A2 goes frontier. A1 and
  A3 are frontier throughout.

## When the loop stops without a TRUE ruling

All return to the orchestrator:

- **STALLED** - `loop status` flags the same finding surviving three outer cycles. Hand back
  with the transcript.
- **Circling** - six or more exchanges in one inner loop without reaching the gate. Escalate
  the fixer; if the next inner loop circles too, hand back.
- **Budget** - the loop obeys check 6. `loop status` warns as cost nears what is left; over
  it, the loop holds and the orchestrator decides.
- **Out of scope** - the real defect is elsewhere. Close this loop and open a new one; a loop
  whose target moves can never meet its exit condition.

A stalled loop is information: three parties failing to agree after evidenced cycles usually
means the thing is under-specified - a `D-id` for TL-Theo, not more cycles. A loop that closes
TRUE is a lesson: hand it to `../kz-reflect/` so the rule, summary or check that let it
through gets fixed, not just the instance.

## Cost

The most expensive thing in `kz-crew021`: two frontier agents plus a fixer, times the rounds.
Use it where a wrong answer is expensive - a Must at Production, a bug that came back, a
security finding - and nowhere else. At MVP one failed attempt is logged and the run moves
on; this skill does not override that. `loop close --tokens` puts the cost on the ledger, so
the session report shows it.
