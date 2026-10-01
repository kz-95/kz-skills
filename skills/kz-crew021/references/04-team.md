# 04 - The crew - 10 agents plus *, tiered

Everything reports to TL-Theo, who is the only agent the user talks to.

```
YOU
 v
TL-Theo (Tech Lead, *)
 +-- PM-Paige *   <-> BA-Baron *      (scope relay)
 +-- * Scheduler  - a script, not an agent
 +-- TW-Tessa o   - SCRIBE, sole writer of shared docs
```

`* Scheduler` replaced what would otherwise be a project-coordinator agent.
Dispatching, locking, merging and bookkeeping need no judgment, so they cost no
tokens.

## Roster

| Group | Agent | Tier | Joins at | Owns |
|---|---|---|---|---|
| Lead | TL-Theo | * | Initialize | `CLAUDE.md` - `doc_ownership.md` - `discussions/` - decides |
| Scope | PM-Paige | * | Initialize | proposes `Purpose.md` - `Feature.md` |
| Scope | BA-Baron | * | Initialize | proposes `specs/F-xxx.md` |
| Docs | TW-Tessa | o | Initialize | **scribe** - every shared doc |
| Design | SA-Silas | * | PoC | `contracts/` direct - TechStack - Risks |
| Design | UX/UI-Uma | o | Pre-Production | `Userflow.md` - `Design.md` |
| Build | FE-Felix | o | Pre-Production | `app/` - `components/` |
| Build | BE-Bruno | o | PoC | `api/` - `server/` |
| Build | DB-Dana | o | Pre-Production | `db/` migrations - `DataSchema.md` |
| Build | DO-Dominic | o | Pre-Production | `.github/` - root config - preview |
| Quality | QA-Quinn | * | Production | `tests/` - `Testing.md` |
| Quality | CR-Cyrus | * | Production | no files - approve / reject |
| Quality | SE-Sera | * | Production | no files - findings -> Risks |
| Release | RM-Riley | o | Production | CHANGELOG (* generated) |
| Release | SR-Sam | o | Maintenance | `Runbook.md` - `ops/` |

UX and UI are one agent on purpose. Splitting them buys a handoff, not a better
interface.

## Tier policy - frontier thinks, low tier executes

*** frontier** - brainstorm, plan, review, QA, architecture, any decision that
is expensive to get wrong: TL - PM - BA - SA - CR - QA - SE.

**o low tier** - execution, fix, debug, writing the code that a contract already
specifies: FE - BE - DB - DO - Uma - TW - RM - SR.

*** zero tokens** - dispatch checks, merge, ledger, velocity, CHANGELOG, Index,
done-when checks, session reports.

**Escalation, one way, on retry only.** First attempt at low tier. A failed
attempt is retried at frontier - never retried again at the same tier. A
low-tier model retrying its own failure patches the symptom, and a patched
symptom costs more than the frontier call would have.

Two agents run in parallel only if their write sets do not overlap. That is
check 2, and it is mechanical.

## When to add an agent

Don't, by default. An agent earns its place when it owns a path glob nobody else
owns, at a tier that matches its work. If a proposed agent has no glob, it is a
task, not a role - give the work to the owner of the files it touches.
