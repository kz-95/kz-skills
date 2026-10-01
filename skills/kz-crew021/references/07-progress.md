# 07 - The progress dashboard, and how a blocker reaches a human

`python scripts/pb.py dashboard` writes `progress.html` and, the first time, `run.bat`.
Double-clicking `run.bat` regenerates the page and opens it. That is the whole interface:
one command, one file, no server.

Generate it **at the end of every slice** - after the last `done` of a batch, and any time
a task is blocked. It is a generated file: never hand-edit it (05-doc-ownership.md), and
never commit a stale one. If the page and the ledger disagree, the ledger is right and the
page has not been regenerated.

## What the page carries

| Part | Comes from | Why it is there |
|---|---|---|
| Overall bar | merged points over all points | One number the user can read from across the room |
| Section bars | one per feature, with its own percent and blocked count | "How far is F-002" is the question actually asked |
| Task table | every task, with status, owner, tier, mustness, points, est and actual | The detail, behind search and filters rather than in front of them |
| Blocked list | `pb.py block` | **The reason the page exists.** See below |
| Changelog | the ledger, newest first | What moved since last time, with what it cost |

Status reads in the user's words, not the ledger's: `planned`, `executing`, `blocked`,
`done`, `dropped`. A task carrying an ASSUMED decision is marked, because the preview
review is where those get answered (02-kickoff.md).

## A blocker is instructions, not a status

```
python scripts/pb.py block T-2 \
  --why "no Stripe API key in this environment" \
  --owner "the user" \
  --step "Sign in at dashboard.stripe.com with the business account" \
  --step "Developers > API keys > Reveal the test key (it starts sk_test_)" \
  --step "Save it in .env.local as STRIPE_SECRET_KEY=sk_test_..., no quotes" \
  --step "Run: python scripts/pb.py unblock T-2"
```

`--step` is required and **two is the minimum**; `pb.py` refuses one step, because one step
is almost always the blocker restated. The test for a step is whether someone who has
never seen this project could follow it without asking a question back. Name the site, the
menu path, the file, the variable, the exact command. "Get the API key" is not a step;
the four above are.

Whose job it is goes in `--owner`, and it is the user unless something else is genuinely
true. A blocker with no owner sits between two people and moves for neither.

`pb.py unblock <task>` clears it and returns the task to the ready queue. Nothing else
clears a blocker: a task that quietly leaves the blocked state without anyone doing the
steps means the steps were never the problem, and that is worth knowing.

## Why this is not the session report

`pb.py report` is for the crew, at the end of a session: velocity, where the tokens went,
rework as a share of spend. The dashboard is for the person paying for it, at any moment:
how far along, what is stuck, what changed. The two never merge - the report's honesty
about cost is for the people who can act on it, and the dashboard's job is to be readable
by someone who will never open a terminal.

## The page is UI, so it follows the UI rules

The dashboard is built under `kz-uiuxrule` like anything else this crew ships,
and the parts that matter are already in the generator:

- **S1** - the task table has a search, sort on every column, a filter per column, a live
  count, and a distinct no-matches state rather than an empty body.
- **V1 / N5** - `aria-sort`, the count, the sort arrow and the current filter are all
  painted in the draw from the one object that holds the view state, so no second element
  has to be kept in step with the thing it marks.
- **A3** - "Clear filters" clears the search *and* every column filter.
- **Y2 / Y1** - contrast is a figure in both themes, and every column of numbers uses
  tabular figures so the right edge holds still while values change.
- **L1** - the overall percentage is the first thing the eye lands on; the table is third.

If the generator grows a destructive control - clear the ledger, drop a task - it takes
S2 with it: a confirm that names the target, with a labelled cancel. There is none today,
which is why there is no confirm today.
