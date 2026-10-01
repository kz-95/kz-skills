# 01 - Lifecycle - five phases, rigor scales per phase

```
Initialize -> Proof of Concept -> Pre-Production -> Production -> Maintenance
                                      ^                            |
                                      +---- next version ----------+
```

Maintenance does not lead to a sixth phase. The next version re-enters
Pre-Production.

## The rigor table

This is the whole point of having phases. The work does not change; the amount
of ceremony around it does.

| | Initialize | Proof of Concept | Pre-Production (MVP) | Production | Maintenance |
|---|---|---|---|---|---|
| **Features in scope** | Purpose only | the riskiest Must | Must only | Must + Good | Good + Nice |
| **Loop** | PM <-> BA - 1 relay | prove / disprove | * done-when checks | TDD + CR + QA loop | regression + monitor |
| **Attempts** | - | 2 (2nd at frontier) | 1 (log, move on) | 2 (2nd at frontier) | 2 (2nd at frontier) |
| **Exit gate** | Purpose clear - Ask Card | kill criteria -> STOP (auto) | Must <= 7 - preview reviewed | CR + tests + SE checklist | release checklist |
| **Verify** | - | * script only | * script only | QA-Quinn + CR-Cyrus agents | regression suite |
| **Human** | Ask Card | notified only on kill | preview review | release approval | - |
| **Budget** | ~5% | ~10% hard cap | ~45% | ~30% | ~10% per release |
| **Crew** | TL - PM - BA - TW | + SA - BE (2 agents) | + Uma FE BE DB DO - * | + QA CR SE RM | TL QA CR SE SR - TW |

Read three rows of that table before every phase: scope, attempts, verify. They
are what people get wrong.

**Attempts, not retries.** The row counts total attempts, because "1 retry" is
ambiguous and the ambiguity always resolves in the expensive direction. Two
attempts means: one at low tier, and if it fails, one at frontier. Then the task
is abandoned. `PHASES` in `pb.py` stores the retry count (attempts - 1) and
`pb.py fail` enforces it.

## Phase notes

**Initialize.** Nothing is built. One relay between PM-Paige and BA-Baron
produces `Purpose.md` and `Feature.md`, then one Ask Card goes to the user. Four
agents, ~5% of budget. If this phase costs more than that, the project is not
understood well enough to build and more agents will not fix it.

**Proof of Concept.** A throwaway spike on the single riskiest Must, by SA-Silas
and BE-Bruno. It exists to be killed. **~10% is a hard cap, not a target** - the
whole value of a spike is that its ceiling is known before it starts.

Kill criteria are written *before* the spike runs and are the exit gate. Hitting
them is a success: the user is notified, the project pivots or stops. A spike
that "mostly worked" and gets kept is the failure mode - the code is throwaway
by construction.

**Pre-Production (MVP).** Must-tier features only, capped at 7. Contract-first:
SA-Silas writes `contracts/` and everyone else builds in parallel against it.
One attempt only - a failing task is logged and the run moves on, because at MVP
the cheapest information is which things fail, not a fixed version of each.

Verification is `pb.py verify`, which executes the task's `done_when` command
and refuses the merge if it fails; `pb.py done` will not merge an unverified
task. No review agents are spent here. Ends at the preview review.

A task abandoned at MVP is not free: if it carried a Must feature, `pb.py gate`
fails until the feature is rebuilt or descoped by a `D-id`. "Log it and move on"
applies to the task, not to the feature.

**Production.** Must + Good. This is where QA-Quinn, CR-Cyrus and SE-Sera join
and reviews become real - `pb.py done` additionally requires `--reviewed`.
Attempts escalate: one at low tier, then frontier. ~30%.

**Maintenance.** Good + Nice, regression and monitoring, SR-Sam joins. ~10% per
release. A new version goes back to Pre-Production, not to Initialize -
`Purpose.md` is already settled.

## Phase exit is a gate, not a vote

Run `python scripts/pb.py gate`. It checks the mechanical half:

- Must count <= 7 (declare them with `pb.py musts F-001 F-004 ...`)
- no open tasks
- **no abandoned Must tasks**
- **every declared Must feature has a merged task**
- within budget

The last two exist because "no open tasks" alone lets an abandoned Must slip
through - at MVP, where a single failed attempt abandons immediately, that is
how a phase passes with a feature that was never built.

The judgment half - "is the Purpose clear", "did the preview review pass" - is
TL-Theo's, logged as a `D-id` in `Decisions.md`.
