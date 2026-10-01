---
name: kz-reflect
description: The self-improving loop for the kz skills. After a fix is verified, log what went wrong (what happened, which rule applied, whether the agent had read it, whether a check existed and caught it, who found it), classify it into one of seven outcomes (strengthen a summary, clarify a rule, add a rule, add or fix a check, record a habit, keep it in the project), and propose the change for a person to approve. A project's lessons are read back at the start of the next run. Never edits a shared rule on its own. Use when the user corrects an agent, when a fix survived a review, or at the close of a task that went wrong. Triggers on "/kz-reflect", "reflect", "what went wrong", "learn from this", "update the rules", "record this mistake".
version: 0.1.0
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-reflect

A rule set that cannot learn from its failures gets broken by the same mistake again. This is the
loop that turns a mistake into a better rule, a better check, or a better summary - with a gate at
each end so it cannot teach the wrong thing.

It **records, classifies and proposes**. It never edits a shared rule. A person approves the change,
and the change is then made the normal way: a rule, a wrong/right sample, a check that fails first.

## What it is not

- Not automatic. A skill does not run by itself; reflection happens when something calls it: you, a
  close-out step in another kz skill, or a session-end hook you wire.
- Not a judge of the agent. A model's account of its own mistake can be wrong, which is why a
  log entry needs evidence and a rule change needs a person.
- Not for every task. It is for a mistake someone *noticed*: a correction, a failed check, a review
  finding that survived a fix.

## Step zero: read what the project has already learned

Before any kz skill starts work, if `.kz/lessons.jsonl` exists in the project:

```bash
python <this skill>/scripts/reflect.py brief
```

It prints what has gone wrong here, most-recurring first. A mistake that has happened twice in this
project is the one to be careful about. If there is no file, there is nothing to read; carry on.

## When to reflect

Reflect when **all** of these hold:

1. Something went wrong that a person noticed - a correction from the user, a check that failed, a
   reviewer finding that survived a fix.
2. **The fix is done and verified.** A measurement, a check's output, an assertion: not "it looks fine".
3. The mistake is not already in the log.

If the fix is not verified yet, **do not log**. Teaching before it works teaches the wrong thing; the
script refuses an entry without evidence and says why.

## The entry

```bash
python scripts/reflect.py log \
  --what "what went wrong, in one sentence of fact" \
  --rule T1                      # the rule it touched, or none \
  --covered yes|no               # did a rule already cover this? search rule-index.md first \
  --read yes|no|unknown          # had the agent read that rule? \
  --check table-check.js|none    # the check that exists for it \
  --caught yes|no|na             # did that check catch it? \
  --found-by check|reviewer|user|self \
  --fix "what changed" \
  --verified "table-check.js reports BOX 4 of 4 before, 0 after" \
  --tags tables,filters
```

Add `--instrument` when the mistake was in the **measurement** (a stale page, a hidden pane, a check
run while the page was still moving), and `--project-only` when it is this project's own decision.

## The seven outcomes

The script classifies from the answers, in this order:

| Question | Answer | Outcome |
|---|---|---|
| Is it a project's own decision? | yes | `PROJECT-ONLY` - keep it here |
| Was the mistake in the measurement? | yes | `LESSON-ONLY` - a habit, no rule changes |
| Did a rule cover it? | yes, not read | `STRENGTHEN-SUMMARY` - put the rule's distinguishing clause in every always-loaded copy |
| | yes, read and misapplied | `CLARIFY-RULE` - reword it so the cheap reading is gone |
| | no | `NEW-RULE` - after searching the rule index, so a covered defect gets no second rule |
| Is there a check? | none | **plus** `ADD-CHECK` - one that fails on the defect, watched failing first |
| | yes, it missed | **plus** `FIX-CHECK` - prove it now fails on the old defect |

`STRENGTHEN-SUMMARY` is the commonest and the cheapest. The reason an agent skipped a rule is nearly
always that the line it **always sees** was weaker than the rule behind a route it may never take
(Appendix Z, lesson 22).

## Then propose, and stop

```bash
python scripts/reflect.py propose --id L-4
```

prints, for each outcome, what to change and the steps to do it. Show it to the person. **Stop there.**
Do not edit the shared rules until they approve. When they do, make the change in the rules repository
with its own workflow: the rule or summary, a wrong/right sample whose wrong half is asserted to still
fail, the check, the counts, and `scripts/validate.py`.

## From this project to the shared rules

A lesson stays in the project's `.kz/` until it earns its way out:

```bash
python scripts/reflect.py recurrences        # what keeps coming back here
python scripts/reflect.py promote --also ../other-project/.kz
```

`promote` offers a lesson for the shared rules or the lessons appendix when it has recurred in two
projects or three times. The bar is the one the design principles already use: a law rediscovered
three times earns a place. A person decides.

## Where things live

| File | What |
|---|---|
| `.kz/lessons.jsonl` | Append-only, one entry per line. The record |
| `.kz/LESSONS.md` | Generated from it by `reflect.py render`. Never edited by hand |

Commit them with the project, or ignore them: the lessons often name the project's own screens, so the
choice is the owner's.

## How the other kz skills use it

- `kz-uiuxrule` reads the brief at step zero, and offers to reflect at close-out when anything was
  corrected during the work.
- `kz-crew021` calls it in the end-of-session retro, for every defect that came back.
- `kz-loopfix` hands it the defect that survived a fix: a recurrence is a root-cause problem.
- `kz-uicheck` is where `ADD-CHECK` and `FIX-CHECK` outcomes land.

## Guardrails, in one place

- **Only after the fix is verified.** The script enforces it.
- **A proposal, never a silent edit.** Shared rules are cited by other people's agents; their IDs are stable.
- **Search before proposing a new rule.** A covered defect needs a stronger summary or a check, not a second rule.
- **Facts, not blame.** An entry says what happened and what changed, with the numbers that proved it.
- **Check the check.** A check that has never failed is a decoration: an `ADD-CHECK` is not done until it was seen to fail.

`python scripts/reflect.py selfcheck` runs the script's own assertions.
