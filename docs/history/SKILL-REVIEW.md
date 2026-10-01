# Skill Review - `kz-crew021`

Review of the renamed skill (formerly `project-builder`), covering `SKILL.md`,
all six `references/` docs, and `scripts/pb.py`. Reviewed 2026-09-16.

## Overall assessment

This is a genuinely strong design. The ideas that make it work are:

- **Tier policy** ("frontier thinks, low tier does, script does no-judgment work") - attacks the cost/quality frontier directly, which is the right axis.
- **Single scribe + append-only `updates/` inbox** - eliminates lock contention and merge conflicts by construction, not by discipline.
- **Write-set locks as the concurrency model** - no merge-conflict resolution step exists because none can occur.
- **Kill criteria written before the spike**, and "hard cap reached without a verdict = kill."
- **Estimate never rewritten** - est sits beside actual in the ledger, protecting the only forecasting signal.
- **"1 session = signal, 3 sessions = evidence"** and the guardrail "every cost metric needs a quality metric beside it" - that last line is the single most important line in the whole skill; it's what keeps the optimization loop from starving agents of context while the numbers look great.

The core problem is not the ideas - it's that **the documents claim more automation than `pb.py` actually implements.** The written workflow and the runnable script have drifted apart, and several of the claims that carry the most weight are currently aspirational.

## Material findings

**1. "Verify is * script only" is not true - `pb.py` has no verify step.**
`01-lifecycle.md` says "Verification is `pb.py` running done-when checks" and `03-dispatch.md`'s verify table lists "* script only" for PoC and Pre-Production. But `pb.py` has no `verify`/`check`/`test` command. `cmd_done` takes `--actual` and marks the task merged on trust - the `done_when` field is stored but never evaluated. The `PHASES` dict even has a `verify` column (`"script"`, `"script+review"`, `"regression"`) that is never read anywhere. So the entire MVP verification strategy is currently "someone says done."
-> Either add a `pb.py verify T-07` command that executes a `done_when` hook, or reword the docs to say the merge/bookkeeping is scripted and verification is manual at MVP.

**2. Check 1 (owner glob) is dead code.**
`cmd_init` writes `"owners": {}`, there is no command that populates it, and `dispatch_checks` guards with `owners and ...` so the check passes vacuously when `owners` is empty. Worse, there is no mechanism described to get the `doc_ownership.md` table (a markdown file) into `config.json`'s `owners` map. The README already flags this, but the fix is a missing *command*, not just a missing value.
-> Add `pb.py owners <glob> <agent>` and a loader, or drop the check until it's real.

**3. Check 5 (context pack) asserts "non-empty" - the #1 lever is unmeasured.**
`dispatch_checks` check 5 is `bool(pack) or not needs`. Meanwhile `06-budget.md` ranks "context pack size" as lever #1 and check 6's escalation ladder contains "pack > 60% of est_in -> trim," but `est_in`/pack size is never computed. So two branches of the budget-gate ladder are unimplementable as written.
-> Implement pack assembly + size measurement. This one change unblocks both the biggest input lever and the budget gate's escalation order.

**4. "mid" tier exists in code and example but is undefined.**
`pb.py`'s `--tier` accepts `["low","mid","frontier"]`, and the canonical task example (`03-dispatch.md`) shows `tier: mid` for FE-Felix - but `04-team.md`'s tier policy defines only * frontier and o low, and no roster agent is "mid." FE-Felix is "o low" in the roster yet "mid" in the example.
-> Either define "mid" (which models? which agents?) or collapse to two tiers and fix the example. As written, half the tasks would be dispatched at an undefined tier.

**5. The exit gate can pass while a Must feature was abandoned.**
`cmd_gate`'s "no open tasks" treats `abandoned` as closed, and "Must count <= 7" counts *features*, not completion. At MVP (retries = 0), a failing Must task goes straight to `abandoned` - which the gate then ignores. You can "pass" the gate with a Must feature never built.
-> Add a gate check: "no abandoned Must tasks" (or require descope via a `D-id` before a Must can be abandoned).

**6. Retry budget doesn't match the docs.**
`01-lifecycle.md` says Production retries are "1 low -> 1 frontier," but `PHASES["production"] = (2, ...)`, and `cmd_fail` abandons only when `attempts >= budget + 1` - i.e. **3 attempts**. The "1 -> 1" notation is itself ambiguous (does it mean 2 total attempts or 3?), so the code and the table can't be reconciled as written.
-> Define the notation once and align the `PHASES` dict with the table.

**7. "Two human touchpoints" understates the actual gates.**
`SKILL.md` headlines "interrupted exactly twice per cycle," but `01-lifecycle.md`'s Human row lists four: Ask Card, kill notification, preview review, and **release approval** (Production). The "two" is only true for the Initialize->Pre-Production arc.
-> Reword the claim so the skill's own docs don't contradict its headline.

**8. Check 6 double-buffers.**
`estimate()` already multiplies by a 1.3 dispatch buffer, then check 6 requires `est <= remaining x 0.8`. Net effect: a task only dispatches if `points x velocity` is under ~61.5% of remaining budget. The docs explain the 1.2 (plan) vs 1.3 (dispatch) difference but never the x0.8, so the combined headroom is undocumented and probably more conservative than intended.

## Minor

- **Worktree vs shared state under-specified** - each agent is "in its own worktree," but `.pb/tasks.json`, locks, and ledger live in the project root. Where `.pb/` sits relative to the worktrees, and whether it's gitignored, is never stated.
- **Default WIP cap (4) < the 5 fan-out lanes** in `02-kickoff.md` - one lane always waits at MVP.
- **`decide --answer` is throwaway** - it only echoes; the decision's real home is `Decisions.md` via the scribe. The argument name implies persistence it doesn't provide.
- **`experiments.md` ownership contradiction** - `05-doc-ownership.md` says "TW-Tessa via `updates/`," `06-budget.md` says "a human writes and reads." Which is it?
- **Domain assumption** - FE/BE/DB/OpenAPI/`routes render` makes this a web-app builder, but "Crew Project" reads general. Non-web projects don't map to the roster or the contracts concept.
- **`overlaps()` is a prefix approximation** (acknowledged in a `ponytail:` comment) - fine today, but a plan-time path-set intersection would remove the residual glob risk.
- **Security is 100% deferred to Production** (SE-Sera) - a reasonable phase-scaling tradeoff, but a cheap always-on "no secrets committed" check would cost nothing.

## What to fix first

1. **Make verification real or make the docs honest** (#1) - the current "script only" claim is the biggest gap between written and actual.
2. **Implement checks 1 and 5 for real** (#2, #3) - the safety gate and the biggest cost lever are both no-ops right now, and both are already acknowledged as gaps in the README.
3. **Fix the exit gate to catch abandoned Musts** (#5) - this is the one that can silently ship a missing MVP feature.
