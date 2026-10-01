# 05 - Doc ownership - one owner per path glob, one scribe for shared docs

Two different rules, and conflating them is what causes lost work.

**Code**: one owner per path glob, and the owner writes the file directly.

**Shared docs**: nobody writes them except TW-Tessa, the scribe.

## The updates/ inbox

To change a shared doc, an agent appends a record to **its own** file:

```
updates/<agent>-<task>.md          append-only
```

One private file per agent per task means two agents can never collide and
nothing ever waits on a lock. The agent appends and keeps working - it never
waits for the scribe.

At each merge point `pb.py` batches the pending `updates/` records and TW-Tessa
applies the whole batch in one pass. One voice, one index, one changelog of
record.

```
agent -> updates/<agent>-<task>.md -> * batch at merge -> TW-Tessa -> shared docs
```

## The ten rules

1. **Code**: one owner per path glob; the owner writes directly.
2. **Shared docs**: nobody writes them but TW-Tessa.
3. To change a shared doc, append a record to your own
   `updates/<agent>-<task>.md` - never edit the doc itself.
4. Agents never wait on the scribe. They append and keep going.
5. * batches `updates/` at each merge point; the scribe applies the batch in one
   pass.
6. Conflicting records in one batch -> the scribe raises it to TL-Theo, TL
   decides, the scribe logs the `D-id`. **A doc is never half-applied.**
7. Generated files are never hand-edited, not even by the scribe - CHANGELOG -
   Index - ProgressTracker - types from `contracts/` - everything in `budget/`.
8. A changed `D-id` re-queues every task that needs it (`pb.py requeue`).
9. An owner change is a `Decisions.md` entry, via `updates/` like everything.
10. Estimates are never rewritten after the fact. The ledger keeps the original
    est next to the actual, always.

Rule 10 is the one under pressure: a task that came in at 3x its estimate makes
the estimate look foolish, and the instinct is to tidy it. Don't. The gap
between est and actual is the only signal that re-sizes the DAG, and a ledger
that has been tidied forecasts nothing.

## The ownership map

Keep this in `doc_ownership.md` at the project root, owned by TL-Theo. The code
rows are also **enforced**: they live in `.pb/config.json` as globs, seeded by
`pb.py init` and checked by dispatch check 1, which holds any task whose writes
land in someone else's glob - and holds every task if the map is empty.

```bash
python scripts/pb.py owners list
python scripts/pb.py owners set "packages/ui/**" FE-Felix
python scripts/pb.py owners import owners.txt      # "<glob> <agent>" per line
```

The markdown table below and the glob map must agree. The table is the
explanation; the map is the gate. When they drift, the gate wins and someone
gets held for a reason the docs do not explain - so change both in one edit.

| Path | Owner | How |
|---|---|---|
| `Decisions.md` `Index.md` `Glossary.md` `Purpose.md` `Feature.md` `archive/` | TW-Tessa | scribe, sole writer |
| `CLAUDE.md` `doc_ownership.md` `discussions/` | TL-Theo | decides |
| `tasks/` `phases/` `Roadmap.md` `budget/` `sessions/` | * scheduler | generated, never hand-edited |
| `Purpose.md` `Feature.md` content | PM-Paige | proposes via `updates/` |
| `specs/F-xxx.md` | BA-Baron | proposes via `updates/` |
| `contracts/` | SA-Silas | writes directly |
| TechStack - Risks | SA-Silas | via `updates/` |
| `Userflow.md` `Design.md` | UX/UI-Uma | via `updates/` |
| `app/` `components/` | FE-Felix | code, writes directly |
| `api/` `server/` | BE-Bruno | code, writes directly |
| `db/` migrations | DB-Dana | code, writes directly |
| `DataSchema.md` | DB-Dana | via `updates/` |
| `.github/` root config - preview | DO-Dominic | code, writes directly |
| `tests/` | QA-Quinn | code, writes directly (Production+) |
| `Testing.md` | QA-Quinn | via `updates/` |
| - | CR-Cyrus | no files: approve / reject + security checklist |
| - | SE-Sera | no files: findings -> `updates/` -> Risks.md |
| CHANGELOG | RM-Riley | * generated |
| `Runbook.md` `ops/` | SR-Sam | Maintenance |
| `experiments.md` | TW-Tessa (scribe) | the human authors the hypothesis and reads the result; the scribe writes the file, via `updates/` like every shared doc |
