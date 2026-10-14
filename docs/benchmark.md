# Skill benchmark: BEFORE

Baseline numbers for the kz skills on small single-file HTML tasks, taken on 2026-10-14 before
any change to the skills. The harness is `scripts/bench/` (see its README); re-run it for AFTER.
Raw results: `scripts/bench/results/before-2026-10-14.json` (and `opus-probe-2026-10-14.json`).

## Method

Six tasks, each a prompt and a starter `index.html` with its data inline.
Each run starts from a fresh copy of the task in a new git repo, and a fresh `CLAUDE_CONFIG_DIR`.
The agent is `claude -p ... --output-format json --permission-mode bypassPermissions`, Claude Code 2.1.299.
The model is the CLI default, which here is Sonnet 5.5; no `--model`, no `--max-turns` on scored runs.
`none` has an empty config dir: no skills, no hooks.
`kz` has `skills/*` copied into `<config>/skills/` and the purpose hook wired on `PreToolUse(Skill)` and `UserPromptSubmit`.
In `kz` the model decides for itself whether to use a skill.
`kz-slash` is the same install with the first prompt sent as `/kz-uiuxrule <prompt>`, the way a user who wants the rules calls them.
Scored runs append "If you would ask me something, assume the recommended option and proceed." in every condition.
Probe runs send the bare prompt with `--max-turns 8`, to see whether the agent stops to ask.
Every cell was run twice; tables show medians, with the wall-time range in brackets.
`iterate-html` sends a build prompt and then three follow-ups in the same session with `--resume`.
Child runs get `CHROME` set, so `kz-uicheck` can run there as it would on a user's machine.
Quality is the same for all: `run-checks.py` at 1280px and 390px, both colour schemes, plus a 5-6 item DOM rubric (`score.mjs`).
Check failures count failing check runs (check x scheme), so one check failing in light and dark counts 2.
"Skill KB read" is kz text entering the context: the skill body loaded, kz files read, and the output of commands run on kz paths.
Tool time and check calls are measured from transcript timestamps (`report.py`).

## Summary

| condition | median slowdown vs none (wall) | range over tasks | median cost factor | rubric passed (all tasks) | check failures (all tasks, both widths) |
|---|---|---|---|---|---|
| none | 1.00x | - | 1.00x | 25.5/31 | 75 |
| kz | 1.25x | 0.66x-2.24x | 1.29x | 29/31 | 32 |
| kz-slash | 2.46x | 1.35x-4.12x | 2.19x | 29/31 | 26 |

Quality delta: kz-slash passes 3.5 more rubric items of 31 than none (table-build 5/5 vs 2/5 accounts for 3 of them) and has 65% fewer check failures (26 vs 75).
On this model the slowdown is 1.3x to 4.1x, not 7x to 30x.
A side probe on Opus 5.5 (one run each, `--model opus`) widened it: trivial-label 8.8 s vs 44.5 s (5.1x, USD 0.29 vs 0.46), chart-filter 102 s vs 284 s (2.8x, USD 0.80 vs 1.40).
No run in any condition stopped to ask, in the probes either (0 of 36): with the request naming the change, the card is skipped ("Reading this as mode 3 (Build) ... skipping the card").
The interactive cost of a card that is shown and answered is therefore not in these numbers.

## Results per task

Medians over 2 scored run(s) per cell; wall time range in brackets. Tokens in = input + cache write + cache read. Asked = probe runs that stopped to ask / probe runs.

### chart-filter

| condition | wall s | turns | tokens in/out | cost USD | asked? | skill KB read | check failures 1280/390 | rubric |
|---|---|---|---|---|---|---|---|---|
| none | 45 (42-47) | 6.0 | 156k / 6k | 0.144 | 0/2 | 0.0 | 6.5 / 6.5 | 2.5/5 |
| kz | 30 (25-34) | 3.0 | 114k / 4k | 0.097 | 0/2 | 0.0 | 4.0 / 4.0 | 3.0/5 |
| kz-slash | 84 (74-93) | 8.0 | 428k / 7k | 0.240 | 0/2 | 43.5 | 2.0 / 2.0 | 3.0/5 |

### form-build

| condition | wall s | turns | tokens in/out | cost USD | asked? | skill KB read | check failures 1280/390 | rubric |
|---|---|---|---|---|---|---|---|---|
| none | 15 (15-16) | 3.5 | 99k / 2k | 0.053 | 0/2 | 0.0 | 4.0 / 5.0 | 5.0/5 |
| kz | 20 (19-21) | 3.0 | 109k / 2k | 0.073 | 0/2 | 0.0 | 1.0 / 1.0 | 5.0/5 |
| kz-slash | 64 (61-66) | 6.0 | 262k / 7k | 0.198 | 0/2 | 32.6 | 0.0 / 0.0 | 5.0/5 |

### iterate-html

| condition | wall s | turns | tokens in/out | cost USD | asked? | skill KB read | check failures 1280/390 | rubric |
|---|---|---|---|---|---|---|---|---|
| none | 50 (48-51) | 11.0 | 293k / 6k | 0.129 | 0/2 | 0.0 | 6.0 / 6.0 | 6.0/6 |
| kz | 60 (59-61) | 11.0 | 358k / 6k | 0.157 | 0/2 | 0.0 | 0.0 / 0.0 | 6.0/6 |
| kz-slash | 154 (106-201) | 18.0 | 969k / 14k | 0.374 | 0/2 | 26.9 | 0.0 / 0.0 | 6.0/6 |

### small-column

| condition | wall s | turns | tokens in/out | cost USD | asked? | skill KB read | check failures 1280/390 | rubric |
|---|---|---|---|---|---|---|---|---|
| none | 9 (9-9) | 3.0 | 111k / 0k | 0.060 | 0/2 | 0.0 | 6.0 / 6.0 | 5.0/5 |
| kz | 9 (9-10) | 3.0 | 120k / 1k | 0.074 | 0/2 | 0.0 | 6.0 / 6.0 | 5.0/5 |
| kz-slash | 27 (22-32) | 5.0 | 166k / 1k | 0.120 | 0/2 | 25.2 | 6.0 / 6.0 | 5.0/5 |

### table-build

| condition | wall s | turns | tokens in/out | cost USD | asked? | skill KB read | check failures 1280/390 | rubric |
|---|---|---|---|---|---|---|---|---|
| none | 27 (26-28) | 3.5 | 122k / 4k | 0.085 | 0/2 | 0.0 | 9.5 / 9.5 | 2.0/5 |
| kz | 60 (55-64) | 9.5 | 371k / 4k | 0.191 | 0/2 | 33.8 | 0.0 / 0.0 | 5.0/5 |
| kz-slash | 50 (50-50) | 6.5 | 298k / 3k | 0.168 | 0/2 | 36.6 | 0.0 / 0.0 | 5.0/5 |

### trivial-label

| condition | wall s | turns | tokens in/out | cost USD | asked? | skill KB read | check failures 1280/390 | rubric |
|---|---|---|---|---|---|---|---|---|
| none | 9 (8-10) | 3.0 | 99k / 0k | 0.034 | 0/2 | 0.0 | 4.0 / 6.0 | 5.0/5 |
| kz | 15 (8-22) | 3.0 | 107k / 0k | 0.046 | 0/2 | 0.0 | 4.0 / 6.0 | 5.0/5 |
| kz-slash | 12 (12-12) | 3.0 | 128k / 1k | 0.081 | 0/2 | 15.5 | 4.0 / 6.0 | 5.0/5 |

Check failures in `small-column` and `trivial-label` are the starter page's own (the same 6 in every condition); neither task asked for a fix.
`chart-filter` scores 2.5-3/5 in every condition: all twelve runs built the site filter as inline chips or tick boxes, none as the T1 panel, with or without the skills.

## Iteration loop, per turn

| condition | run | turn | prompt | wall s | turns | tokens in/out | cost USD | skill KB read |
|---|---|---|---|---|---|---|---|---|
| none | 1 | 1 | Build a single HTML page in index | 23 | 2 | 68k / 3k | 0.066 | 0.0 |
| none | 1 | 2 | Make the filter remember its value on reload | 8 | 3 | 72k / 1k | 0.017 | 0.0 |
| none | 1 | 3 | Add a dark mode toggle | 13 | 4 | 75k / 2k | 0.031 | 0.0 |
| none | 1 | 4 | The detail panel should close on Escape | 7 | 2 | 78k / 0k | 0.014 | 0.0 |
| none | 2 | 1 | Build a single HTML page in index | 22 | 2 | 68k / 3k | 0.069 | 0.0 |
| none | 2 | 2 | Make the filter remember its value on reload | 6 | 3 | 72k / 0k | 0.016 | 0.0 |
| none | 2 | 3 | Add a dark mode toggle | 12 | 4 | 75k / 2k | 0.031 | 0.0 |
| none | 2 | 4 | The detail panel should close on Escape | 8 | 2 | 78k / 0k | 0.013 | 0.0 |
| kz | 1 | 1 | Build a single HTML page in index | 28 | 2 | 74k / 4k | 0.086 | 0.0 |
| kz | 1 | 2 | Make the filter remember its value on reload | 9 | 3 | 79k / 1k | 0.017 | 0.0 |
| kz | 1 | 3 | Add a dark mode toggle | 18 | 4 | 82k / 2k | 0.035 | 0.0 |
| kz | 1 | 4 | The detail panel should close on Escape | 7 | 2 | 85k / 0k | 0.014 | 0.0 |
| kz | 2 | 1 | Build a single HTML page in index | 30 | 4 | 146k / 4k | 0.097 | 0.0 |
| kz | 2 | 2 | Make the filter remember its value on reload | 10 | 3 | 80k / 1k | 0.018 | 0.0 |
| kz | 2 | 3 | Add a dark mode toggle | 12 | 2 | 83k / 1k | 0.029 | 0.0 |
| kz | 2 | 4 | The detail panel should close on Escape | 8 | 2 | 86k / 1k | 0.017 | 0.0 |
| kz-slash | 1 | 1 | /kz-uiuxrule: Build a single HTML page in index | 64 | 5 | 184k / 7k | 0.186 | 25.2 |
| kz-slash | 1 | 2 | Make the filter remember its value on reload | 14 | 2 | 107k / 1k | 0.026 | 0.4 |
| kz-slash | 1 | 3 | Add a dark mode toggle | 20 | 3 | 165k / 1k | 0.035 | 0.2 |
| kz-slash | 1 | 4 | The detail panel should close on Escape | 8 | 2 | 113k / 0k | 0.017 | 0.0 |
| kz-slash | 2 | 1 | /kz-uiuxrule: Build a single HTML page in index | 96 | 9 | 403k / 10k | 0.253 | 23.6 |
| kz-slash | 2 | 2 | Make the filter remember its value on reload | 55 | 8 | 490k / 4k | 0.120 | 3.0 |
| kz-slash | 2 | 3 | Add a dark mode toggle | 36 | 4 | 267k / 3k | 0.071 | 1.6 |
| kz-slash | 2 | 4 | The detail panel should close on Escape | 15 | 3 | 209k / 1k | 0.040 | 0.0 |

The follow-ups do not re-read the rules (0-3 KB per turn after the first), but they do re-run the check suite: kz-slash ran `run-checks.py` 1 and 5 times on "remember the filter", and 1 and 2 times on "add a dark mode toggle".
Run 2's "remember the filter" took 55 s and 8 turns against 6-10 s and 3 turns in none and kz.

## Three biggest causes of slowness

1. **The check suite, and the fix-and-recheck loop after it.**
   kz-slash ran `kz-uicheck/scripts/run-checks.py` in 10 of 12 scored runs, 1 to 12 calls per run, median 16 s of tool time per run (54 s in the slowest).
   Every call is ten checks x two schemes in headless Chrome; agents usually call it at 1280 and again at 390.
   Each finding then costs another edit and another full run (min-height 44px, reduced motion, layout shift), which is where the extra turns come from (chart-filter 8 vs 6, iterate-html 18 vs 11).
   On Opus the trivial label change ran the full suite at both widths: about 28 s of a 44 s run, for a one-line diff.
2. **A fixed reading cost on every invocation, whatever the size of the task.**
   `/kz-uiuxrule` loads the 15.5 KB SKILL.md into every run, then 10-30 KB more of INDEX.md, rule slices and the filter-table snippet (25-44 KB median per build task).
   The one-line label change read 15.5 KB and cost 2.4x (USD 0.081 vs 0.034); input tokens run 2-3x none on build tasks (chart-filter 428k vs 156k).
   ui-rules.md (166 KB) was never read in full: 0 of 24 kz and kz-slash runs did; agents sliced it with `sed -n`/`grep`. Splitting it will help a model that does read it whole, but it is not the cost seen here.
3. **Scope that grows past the request.**
   BUILD mode's "leave a check behind" makes the agent write and run its own test code: the Opus chart-filter run added `checks/chart-check.js` and `checks/run-chart-check.py` to the user's project, took screenshots and read them back, 21 turns.
   A Sonnet kz-slash pilot run added a data table under the chart, sortable columns and empty states that were not asked for.

What did not cost much: the purpose hook (it fires, the model skips the card in one line), and the `kz` condition, where the model invoked a kz skill in only 2 of 12 runs (both table-build, which read the filter-table snippet and gained 3 rubric items).
In `none`, chart-filter invoked the built-in `dataviz` skill both times; in `kz` it never did.

## What did not work, and limits

- Two runs per cell is enough to see 2x, not to rank 1.2x; wall time includes API latency (trivial-label kz: 8 s and 22 s for the same work).
- The rubric is heuristic DOM probing; an unusual control is scored as a fail. Two heuristics were fixed after reading pages (status words, a fixed side panel) and that task re-scored.
- A sandboxed parent shell made child file writes vanish; the harness has to run outside the sandbox.
- A first pilot without `CHROME` in the child env was discarded: the kz runs could not run their checks and looked cheaper than a user's.
- `total_cost_usd` and `duration_api_ms` are cumulative across `--resume`; per-turn values are deltas (run.py now does this; the BEFORE file was corrected after the run).
- Spend: USD 8.95 for the BEFORE file, USD 2.95 for the Opus probe, about USD 4 for the discarded pilot and harness tests; about USD 16 in all.

## AFTER (2026-10-14)

The same question after the speed contract (commit 62aa905) and the T1 chart-filter change (commit 2eb8758), with a stricter harness.
`before` is `skills/` as on origin/main (1bbb54d), the version the BEFORE section measured; `after` is this branch (2eb8758).
Both were re-run in one shuffled batch with the same harness, so the AFTER tables compare like with like; do not compare them number for number with the BEFORE tables above.
Raw results: `scripts/bench/results/after-2026-10-14.json` (none and after), `before-v2-2026-10-14.json` (before), `judge-2026-10-14.json` (judge), and five blind pairs in `scripts/bench/results/pairs/`.

### Method changes

Seven tasks: the six above plus `dark-mode`, "Add a dark mode toggle to this page." on an existing page with a table, a form and an SVG chart whose colours are set in script.
Every starter now passes the kz checks with 0 failures at 1280 and 390 (`trivial-label` and `small-column` were fixed: 44px targets, 16px inputs, press feedback, a T2 filter row), so every failure counted is one the agent introduced (run minus starter).
Conditions: `none`; `installed` (skills present, the model chooses); `/kz-uiuxrule`; `/kz-flashrule`; `/kz-fastfix` on the four small tasks only (trivial-label, small-column, dark-mode, iterate-html).
On iterate-html, `/kz-fastfix` sends the build prompt bare and each follow-up as `/kz-fastfix <follow-up>`; the other slash conditions send the follow-ups bare, as before.
`before` ran only for installed and /kz-uiuxrule (the old flash and fastfix lanes were never routed to); `after` ran for every kz condition; `none` ran once per model.
Models are named: `--model claude-sonnet-5-5` (3 runs per cell, every cell) and `--model claude-opus-5-5` (2 runs per cell for none, /kz-uiuxrule before and after, /kz-flashrule and /kz-fastfix after; no installed).
That is 202 agent runs: repeat k of every cell ran in round k, each round shuffled with seed 20261014 (recorded with the launch order), 3 at a time, Claude Code 2.1.299.
Each run records its start time, CLI version and the model id the CLI reports (always the one requested).
Children now run with `--permission-mode acceptEdits --allowedTools Read,Edit,Write,MultiEdit,Glob,Grep,Skill,TodoWrite,Task,Agent,Bash` instead of `bypassPermissions`, which this host's safety check refused to launch; no run hit a permission denial.
Tokens: `tokens_total` = input + cache write + cache read + output, which does not depend on cache hits; cost is the CLI's `total_cost_usd`, which does. Resumed turns are per-turn deltas.
Quality adds three measures to the kz checks and the rubric: axe-core 4.10.3 violations by impact at 1280 and 390 (serious + critical shown); Lighthouse 12.8.2 accessibility and best-practices at mobile, over a local http server; and a blind pairwise judge.
The judge: for each model, task and repeat, the `none` page against the `after` /kz-uiuxrule page and against the `after` /kz-flashrule page.
Each page gets a full-page screenshot at 1280 and 390 and a strip of frames from a scripted interaction (open the filter, untick a value; submit the empty form, then a filled one; open a job, press Escape, flip the theme).
Sides are shuffled and named A and B only, and `claude -p --model claude-opus-5-5 --tools Read` in an empty config is asked: "Two versions of the same page built from the same request: <task prompt>. Which would a real user find better to use, A, B or tie? Answer as JSON {winner, reasons[3]}."
The rubric's chart-filter item "the site filter is a T1 panel" now uses `table-check.js`'s CHARTBOX definition, the same one the skills check against.
Two rubric heuristics were widened after reading pages, and those tasks re-scored for every condition: the iterate-html status filter may be a panel of tick boxes or radios, and a dark mode control may be the Dark button of a System / Light / Dark group.
Tables show medians; factors are per task (cell median over none's median, same model), then the median over tasks with the range over tasks in brackets.
"kz-check failures introduced" and "axe serious+critical" are sums over tasks of per-task medians; the rubric is the sum of per-task medians out of 37 (22 on the small tasks).
The judge column is the share of comparisons the judge gave to the kz page, with wins-losses-ties; ties count as not won.

### Sonnet 5.5 (claude-sonnet-5-5)

#### Summary

| condition | skills | tasks | wall time vs none | tokens_total vs none | cost vs none | kz-check failures introduced | rubric | axe serious+critical | Lighthouse a11y | judge: kz preferred (W-L-T) |
|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 7 | 1.00x (1.00x-1.00x) | 1.00x (1.00x-1.00x) | 1.00x (1.00x-1.00x) | 50 | 32/37 | 1 | 1.00 | - |
| none (small tasks only) | - | 4 | 1.00x (1.00x-1.00x) | 1.00x (1.00x-1.00x) | 1.00x (1.00x-1.00x) | 12 | 22/22 | 1 | 1.00 | - |
| installed | before | 7 | 1.14x (0.90x-1.50x) | 1.09x (1.02x-1.72x) | 1.23x (1.02x-1.93x) | 12 | 34/37 | 0 | 1.00 | - |
| installed | after | 7 | 1.09x (0.90x-2.85x) | 1.12x (1.08x-2.79x) | 1.33x (1.12x-2.45x) | 8 | 37/37 | 0 | 1.00 | - |
| /kz-uiuxrule | before | 7 | 2.54x (1.19x-3.92x) | 2.22x (1.27x-2.70x) | 2.12x (1.76x-5.00x) | 4 | 35/37 | 0 | 1.00 | - |
| /kz-uiuxrule | after | 7 | 1.52x (1.07x-2.40x) | 2.15x (1.17x-3.79x) | 1.86x (1.65x-3.31x) | 0 | 37/37 | 0 | 1.00 | 33% (7-5-9 of 21) |
| /kz-flashrule | after | 7 | 1.38x (0.93x-2.96x) | 1.62x (0.88x-2.42x) | 1.74x (1.02x-2.60x) | 4 | 36/37 | 0 | 1.00 | 43% (9-4-8 of 21) |
| /kz-fastfix | after | 4 | 1.24x (1.22x-1.35x) | 1.53x (1.49x-1.55x) | 1.50x (1.48x-1.96x) | 0 | 22/22 | 0 | 1.00 | - |

On Sonnet, `/kz-uiuxrule` went from 2.54x to 1.52x wall time; tokens hardly moved (2.22x to 2.15x), because the saving is in tool time, not in context.
Its quality held: 0 check failures introduced (4 before, 50 in none) and the full rubric, 37 of 37.
`installed` now routes: 14 of 21 runs invoked a kz skill (kz-flashrule 8 on the build tasks, kz-fastfix 6 on dark-mode and small-column), against 2 of 21 before, at 1.09x wall time and 1.33x cost, with 8 failures introduced against none's 50.
`/kz-flashrule` is the cheapest full lane on Sonnet (1.38x wall, 1.62x tokens); it ran the check suite only on table-build (3 of 21 runs) and left 4 failures.
`/kz-fastfix` on the small tasks costs 1.24x wall and 1.5x tokens, never ran the check suite, and introduced 0 failures where none introduced 12.
The one task where `after` is heavier is iterate-html under `/kz-uiuxrule`: 25 turns and 1185k tokens against 14 and 716k before, with one run at 258 s.

#### Per task

Medians over the runs in each cell (n); wall time range in brackets.
Failures are those the agent introduced (run minus starter), at 1280 + 390.
LH is Lighthouse mobile accessibility / best practices.

##### trivial-label

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 3 | 9 (9-13) | 3 | 104k | 0.035 | 0.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| installed | before | 3 | 10 (9-15) | 3 | 113k | 0.047 | 0.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| installed | after | 3 | 10 (8-11) | 3 | 113k | 0.048 | 0.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| /kz-uiuxrule | before | 3 | 11 (11-14) | 3 | 134k | 0.083 | 15.5 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| /kz-uiuxrule | after | 3 | 10 (8-10) | 3 | 122k | 0.062 | 6.1 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| /kz-flashrule | after | 3 | 10 (8-15) | 3 | 126k | 0.068 | 9.7 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| /kz-fastfix | after | 3 | 12 (11-12) | 5 | 160k | 0.069 | 5.1 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |

##### small-column

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 3 | 10 (10-12) | 3 | 118k | 0.065 | 0.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| installed | before | 3 | 13 (8-15) | 4 | 162k | 0.077 | 0.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| installed | after | 3 | 12 (10-13) | 6 | 132k | 0.087 | 5.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| /kz-uiuxrule | before | 3 | 31 (25-35) | 5 | 150k | 0.122 | 19.7 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-uiuxrule | after | 3 | 12 (12-15) | 5 | 233k | 0.108 | 6.5 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-flashrule | after | 3 | 11 (11-12) | 3 | 140k | 0.098 | 9.6 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| /kz-fastfix | after | 3 | 12 (12-14) | 5 | 180k | 0.097 | 5.1 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |

##### dark-mode

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 3 | 20 (19-20) | 3 | 121k | 0.085 | 0.0 | 0 | 6/6 | 0 | 1.00/0.96 | 0/3 |
| installed | before | 3 | 22 (21-28) | 3 | 131k | 0.105 | 0.0 | 0 | 6/6 | 0 | 1.00/0.96 | 0/3 |
| installed | after | 3 | 20 (19-22) | 5 | 135k | 0.111 | 4.9 | 0 | 6/6 | 0 | 1.00/0.96 | 0/3 |
| /kz-uiuxrule | before | 3 | 44 (43-44) | 7 | 268k | 0.181 | 23.1 | 0 | 6/6 | 0 | 1.00/0.96 | 3/3 |
| /kz-uiuxrule | after | 3 | 30 (29-30) | 6 | 260k | 0.158 | 17.8 | 0 | 6/6 | 0 | 1.00/0.96 | 3/3 |
| /kz-flashrule | after | 3 | 28 (24-38) | 4 | 196k | 0.148 | 9.6 | 0 | 6/6 | 0 | 1.00/0.96 | 0/3 |
| /kz-fastfix | after | 3 | 27 (25-32) | 5 | 187k | 0.127 | 5.1 | 0 | 6/6 | 0 | 1.00/0.96 | 0/3 |

##### table-build

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 3 | 33 (31-39) | 4 | 150k | 0.097 | 0.0 | 18 | 2/5 | 0 | 1.00/0.96 | 0/3 |
| installed | before | 3 | 49 (33-86) | 8 | 258k | 0.187 | 25.2 | 0 | 5/5 | 0 | 1.00/0.96 | 2/3 |
| installed | after | 3 | 93 (69-97) | 10 | 419k | 0.207 | 28.6 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-uiuxrule | before | 3 | 73 (65-85) | 7 | 366k | 0.180 | 36.4 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-uiuxrule | after | 3 | 65 (64-68) | 9 | 430k | 0.192 | 33.4 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-flashrule | after | 3 | 97 (71-553) | 7 | 365k | 0.195 | 30.9 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |

##### chart-filter

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 3 | 42 (41-47) | 7 | 214k | 0.144 | 0.0 | 12 | 3/5 | 0 | 1.00/0.96 | 0/3 |
| installed | before | 3 | 38 (21-41) | 7 | 219k | 0.147 | 0.0 | 12 | 2/5 | 0 | 1.00/0.96 | 0/3 |
| installed | after | 3 | 38 (38-79) | 7 | 237k | 0.164 | 17.0 | 4 | 5/5 | 0 | 1.00/0.96 | 1/3 |
| /kz-uiuxrule | before | 3 | 110 (88-120) | 7 | 348k | 0.253 | 36.6 | 4 | 3/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-uiuxrule | after | 3 | 64 (48-66) | 8 | 392k | 0.265 | 46.9 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-flashrule | after | 3 | 40 (36-45) | 4 | 188k | 0.147 | 9.7 | 4 | 4/5 | 0 | 1.00/0.96 | 0/3 |

##### form-build

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 3 | 19 (17-19) | 3 | 106k | 0.053 | 0.0 | 8 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| installed | before | 3 | 23 (22-23) | 3 | 117k | 0.077 | 0.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| installed | after | 3 | 35 (20-39) | 6 | 178k | 0.130 | 9.5 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |
| /kz-uiuxrule | before | 3 | 74 (57-81) | 6 | 287k | 0.266 | 50.7 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-uiuxrule | after | 3 | 45 (41-51) | 7 | 294k | 0.176 | 18.0 | 0 | 5/5 | 0 | 1.00/0.96 | 3/3 |
| /kz-flashrule | after | 3 | 39 (33-42) | 4 | 181k | 0.138 | 9.7 | 0 | 5/5 | 0 | 1.00/0.96 | 0/3 |

##### iterate-html

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 3 | 55 (53-55) | 11 | 313k | 0.134 | 0.0 | 12 | 6/6 | 1 | 0.95/0.96 | 0/3 |
| installed | before | 3 | 63 (62-63) | 11 | 342k | 0.162 | 0.0 | 0 | 6/6 | 0 | 1.00/0.96 | 0/3 |
| installed | after | 3 | 57 (55-61) | 11 | 338k | 0.150 | 0.0 | 4 | 6/6 | 0 | 1.00/0.96 | 0/3 |
| /kz-uiuxrule | before | 3 | 140 (118-145) | 14 | 716k | 0.305 | 29.1 | 0 | 6/6 | 0 | 1.00/0.96 | 3/3 |
| /kz-uiuxrule | after | 3 | 132 (92-258) | 25 | 1185k | 0.391 | 19.8 | 0 | 6/6 | 0 | 1.00/0.96 | 3/3 |
| /kz-flashrule | after | 3 | 76 (76-80) | 11 | 522k | 0.225 | 9.7 | 0 | 6/6 | 0 | 1.00/0.96 | 0/3 |
| /kz-fastfix | after | 3 | 68 (63-70) | 11 | 467k | 0.202 | 15.2 | 0 | 6/6 | 0 | 1.00/0.96 | 0/3 |

#### Iteration loop, per turn (medians over runs)

| condition | skills | turn | prompt | wall s | turns | tokens_total | cost USD | skill KB |
|---|---|---|---|---|---|---|---|---|
| none | - | 1 | Build a single HTML page in index | 24 | 2 | 74k | 0.068 | 0.0 |
| none | - | 2 | Make the filter remember its value on reload | 9 | 3 | 76k | 0.018 | 0.0 |
| none | - | 3 | Add a dark mode toggle | 14 | 4 | 80k | 0.034 | 0.0 |
| none | - | 4 | The detail panel should close on Escape | 8 | 2 | 82k | 0.014 | 0.0 |
| installed | before | 1 | Build a single HTML page in index | 27 | 2 | 81k | 0.085 | 0.0 |
| installed | before | 2 | Make the filter remember its value on reload | 10 | 3 | 83k | 0.019 | 0.0 |
| installed | before | 3 | Add a dark mode toggle | 18 | 4 | 88k | 0.039 | 0.0 |
| installed | before | 4 | The detail panel should close on Escape | 9 | 2 | 90k | 0.018 | 0.0 |
| installed | after | 1 | Build a single HTML page in index | 26 | 2 | 81k | 0.085 | 0.0 |
| installed | after | 2 | Make the filter remember its value on reload | 8 | 3 | 83k | 0.018 | 0.0 |
| installed | after | 3 | Add a dark mode toggle | 14 | 4 | 86k | 0.033 | 0.0 |
| installed | after | 4 | The detail panel should close on Escape | 7 | 2 | 88k | 0.017 | 0.0 |
| /kz-uiuxrule | before | 1 | /kz-uiuxrule Build a single HTML page in index | 64 | 6 | 255k | 0.207 | 29.0 |
| /kz-uiuxrule | before | 2 | Make the filter remember its value on reload | 23 | 3 | 171k | 0.034 | 0.1 |
| /kz-uiuxrule | before | 3 | Add a dark mode toggle | 30 | 3 | 181k | 0.053 | 0.2 |
| /kz-uiuxrule | before | 4 | The detail panel should close on Escape | 12 | 2 | 124k | 0.021 | 0.1 |
| /kz-uiuxrule | after | 1 | /kz-uiuxrule Build a single HTML page in index | 66 | 10 | 351k | 0.216 | 17.6 |
| /kz-uiuxrule | after | 2 | Make the filter remember its value on reload | 22 | 4 | 225k | 0.051 | 0.1 |
| /kz-uiuxrule | after | 3 | Add a dark mode toggle | 21 | 2 | 117k | 0.036 | 0.3 |
| /kz-uiuxrule | after | 4 | The detail panel should close on Escape | 14 | 2 | 206k | 0.032 | 0.0 |
| /kz-flashrule | after | 1 | /kz-flashrule Build a single HTML page in inde | 43 | 5 | 224k | 0.148 | 9.7 |
| /kz-flashrule | after | 2 | Make the filter remember its value on reload | 12 | 2 | 98k | 0.023 | 0.0 |
| /kz-flashrule | after | 3 | Add a dark mode toggle | 13 | 2 | 102k | 0.030 | 0.0 |
| /kz-flashrule | after | 4 | The detail panel should close on Escape | 7 | 2 | 104k | 0.017 | 0.0 |
| /kz-fastfix | after | 1 | Build a single HTML page in index | 26 | 2 | 81k | 0.084 | 0.0 |
| /kz-fastfix | after | 2 | /kz-fastfix Make the filter remember its value | 10 | 3 | 87k | 0.026 | 5.1 |
| /kz-fastfix | after | 3 | /kz-fastfix Add a dark mode toggle | 18 | 4 | 147k | 0.053 | 5.1 |
| /kz-fastfix | after | 4 | /kz-fastfix The detail panel should close on E | 10 | 2 | 104k | 0.025 | 5.1 |

#### Routing and asking

| condition | skills | runs | skills the model invoked (runs) | runs that asked | runs with a permission denial | runs that ran kz-uicheck | median kz-uicheck calls |
|---|---|---|---|---|---|---|---|
| none | - | 21 | dataviz (3) | 0 | 0 | 0 | 0 |
| installed | before | 21 | dataviz (2); kz-uiuxrule (1); kz-flashrule (1) | 0 | 0 | 2 | 0 |
| installed | after | 21 | kz-flashrule (8); kz-fastfix (6) | 0 | 0 | 4 | 0 |
| /kz-uiuxrule | before | 21 | none | 0 | 0 | 18 | 1 |
| /kz-uiuxrule | after | 21 | none | 0 | 0 | 18 | 2 |
| /kz-flashrule | after | 21 | none | 0 | 0 | 3 | 0 |
| /kz-fastfix | after | 12 | none | 0 | 0 | 0 | 0 |

### Opus 5.5 (claude-opus-5-5)

#### Summary

| condition | skills | tasks | wall time vs none | tokens_total vs none | cost vs none | kz-check failures introduced | rubric | axe serious+critical | Lighthouse a11y | judge: kz preferred (W-L-T) |
|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 7 | 1.00x (1.00x-1.00x) | 1.00x (1.00x-1.00x) | 1.00x (1.00x-1.00x) | 55 | 34/37 | 1 | 1.00 | - |
| none (small tasks only) | - | 4 | 1.00x (1.00x-1.00x) | 1.00x (1.00x-1.00x) | 1.00x (1.00x-1.00x) | 14 | 22/22 | 0.5 | 1.00 | - |
| /kz-uiuxrule | before | 7 | 3.35x (2.20x-6.14x) | 4.17x (1.68x-4.84x) | 3.50x (2.30x-4.31x) | 4 | 34/37 | 0 | 1.00 | - |
| /kz-uiuxrule | after | 7 | 1.67x (0.93x-2.39x) | 1.86x (1.23x-3.33x) | 1.97x (1.05x-2.81x) | 0 | 36.5/37 | 0 | 1.00 | 21% (3-7-4 of 14) |
| /kz-flashrule | after | 7 | 1.92x (1.14x-2.64x) | 1.89x (1.39x-4.07x) | 1.78x (1.40x-3.01x) | 0 | 35/37 | 0 | 1.00 | 14% (2-8-4 of 14) |
| /kz-fastfix | after | 4 | 1.70x (0.96x-2.00x) | 1.73x (1.44x-2.80x) | 2.00x (1.18x-3.28x) | 7.5 | 21/22 | 0 | 1.00 | - |

On Opus, `/kz-uiuxrule` halved: wall time 3.35x to 1.67x, tokens 4.17x to 1.86x, cost 3.50x to 1.97x, with 0 failures introduced (none: 55) and 36.5 of 37 rubric items (34 before).
The largest drops: small-column 104 s and 18 turns to 19 s and 6 turns; chart-filter 440 s to 145 s; table-build 211 s to 86 s; iterate-html 540 s to 302 s.
`/kz-flashrule` is not cheaper than `/kz-uiuxrule` on Opus (1.92x against 1.67x wall): it ran the check suite in 12 of 14 runs, median 3.5 calls.
`/kz-fastfix` on Opus costs 1.70x wall and 2.00x money on the small tasks: it ran the check suite in 6 of 8 runs (2 to 6 calls) although the lane says at most one check, and in 2 runs the bare build turn of iterate-html invoked kz-flashrule on its own.
Its iterate-html follow-ups took 45, 53 and 38 s against none's 15, 26 and 15 s, and it introduced 7.5 failures there (layout-audit and modal-check, after the dark mode toggle).
The follow-ups under `/kz-uiuxrule` went from 99, 95 and 114 s to 86, 41 and 70 s: lighter, not light.

#### Per task

Medians over the runs in each cell (n); wall time range in brackets.
Failures are those the agent introduced (run minus starter), at 1280 + 390.
LH is Lighthouse mobile accessibility / best practices.

##### trivial-label

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 2 | 13 (12-13) | 4.5 | 121k | 0.084 | 0.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/2 |
| /kz-uiuxrule | before | 2 | 37 (29-44) | 6 | 202k | 0.208 | 16.4 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-uiuxrule | after | 2 | 21 (18-24) | 6 | 224k | 0.166 | 6.4 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-flashrule | after | 2 | 14 (14-15) | 4.5 | 168k | 0.159 | 9.7 | 0 | 5/5 | 0 | 1.00/0.96 | 0/2 |
| /kz-fastfix | after | 2 | 19 (19-19) | 6.5 | 200k | 0.276 | 5.1 | 0 | 5/5 | 0 | 1.00/0.96 | 0/2 |

##### small-column

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 2 | 17 (16-18) | 4.5 | 180k | 0.161 | 0.0 | 0 | 5/5 | 0 | 1.00/0.96 | 0/2 |
| /kz-uiuxrule | before | 2 | 104 (87-120) | 18 | 754k | 0.599 | 30.6 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-uiuxrule | after | 2 | 19 (19-20) | 6 | 221k | 0.206 | 6.6 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-flashrule | after | 2 | 32 (29-36) | 8 | 339k | 0.288 | 11.8 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-fastfix | after | 2 | 32 (28-36) | 8.5 | 325k | 0.276 | 7.5 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |

##### dark-mode

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 2 | 51 (47-56) | 6 | 237k | 0.277 | 0.0 | 0 | 6/6 | 0 | 1.00/0.96 | 0/2 |
| /kz-uiuxrule | before | 2 | 113 (87-138) | 21 | 773k | 0.679 | 33.4 | 0 | 6/6 | 0 | 1.00/0.96 | 2/2 |
| /kz-uiuxrule | after | 2 | 88 (85-91) | 13.5 | 747k | 0.596 | 27.2 | 0 | 6/6 | 0 | 1.00/0.96 | 2/2 |
| /kz-flashrule | after | 2 | 67 (58-77) | 8 | 407k | 0.389 | 15.0 | 0 | 6/6 | 0 | 1.00/0.96 | 2/2 |
| /kz-fastfix | after | 2 | 49 (42-56) | 7.5 | 340k | 0.327 | 9.9 | 0 | 6/6 | 0 | 1.00/0.96 | 2/2 |

##### table-build

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 2 | 92 (79-106) | 11 | 393k | 0.495 | 0.0 | 18 | 4/5 | 0 | 1.00/0.96 | 0/2 |
| /kz-uiuxrule | before | 2 | 211 (186-236) | 22.5 | 1275k | 1.137 | 58.2 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-uiuxrule | after | 2 | 86 (83-89) | 10.5 | 507k | 0.522 | 25.2 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-flashrule | after | 2 | 189 (170-209) | 14 | 755k | 0.779 | 32.8 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |

##### chart-filter

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 2 | 105 (92-118) | 17 | 630k | 0.600 | 0.0 | 12 | 3/5 | 0.5 | 0.97/0.96 | 0/2 |
| /kz-uiuxrule | before | 2 | 440 (383-497) | 39 | 2678k | 2.099 | 109.6 | 4 | 3.5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-uiuxrule | after | 2 | 145 (116-174) | 16.5 | 978k | 0.897 | 21.7 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-flashrule | after | 2 | 163 (144-183) | 18.5 | 938k | 0.841 | 21.5 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |

##### form-build

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 2 | 56 (51-60) | 5.5 | 211k | 0.242 | 0.0 | 11 | 5/5 | 0 | 1.00/0.96 | 0/2 |
| /kz-uiuxrule | before | 2 | 186 (160-212) | 15.5 | 879k | 1.040 | 37.1 | 0 | 3.5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-uiuxrule | after | 2 | 108 (93-123) | 13 | 700k | 0.680 | 43.8 | 0 | 4.5/5 | 0 | 1.00/0.96 | 2/2 |
| /kz-flashrule | after | 2 | 139 (137-140) | 16.5 | 856k | 0.727 | 30.2 | 0 | 5/5 | 0 | 1.00/0.96 | 2/2 |

##### iterate-html

| condition | skills | n | wall s | turns | tokens_total | cost USD | skill KB | failures introduced | rubric | axe s+c | LH a11y/bp | ran kz-uicheck |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | - | 2 | 126 (123-129) | 20.5 | 654k | 0.539 | 0.0 | 14 | 6/6 | 0.5 | 0.97/0.96 | 0/2 |
| /kz-uiuxrule | before | 2 | 540 (517-562) | 36.5 | 3167k | 2.174 | 36.1 | 0 | 6/6 | 0 | 1.00/0.96 | 2/2 |
| /kz-uiuxrule | after | 2 | 302 (286-318) | 33 | 1723k | 1.255 | 27.6 | 0 | 6/6 | 0 | 1.00/0.96 | 2/2 |
| /kz-flashrule | after | 2 | 333 (306-360) | 31.5 | 1972k | 1.354 | 21.0 | 0 | 4/6 | 0 | 1.00/0.96 | 2/2 |
| /kz-fastfix | after | 2 | 252 (240-265) | 37.5 | 1830k | 1.234 | 29.9 | 7.5 | 5/6 | 0 | 1.00/0.96 | 2/2 |

#### Iteration loop, per turn (medians over runs)

| condition | skills | turn | prompt | wall s | turns | tokens_total | cost USD | skill KB |
|---|---|---|---|---|---|---|---|---|
| none | - | 1 | Build a single HTML page in index | 70 | 5.5 | 193k | 0.294 | 0.0 |
| none | - | 2 | Make the filter remember its value on reload | 15 | 4 | 130k | 0.062 | 0.0 |
| none | - | 3 | Add a dark mode toggle | 26 | 6.5 | 162k | 0.108 | 0.0 |
| none | - | 4 | The detail panel should close on Escape | 15 | 4.5 | 170k | 0.074 | 0.0 |
| /kz-uiuxrule | before | 1 | /kz-uiuxrule Build a single HTML page in index | 232 | 12 | 763k | 0.955 | 33.3 |
| /kz-uiuxrule | before | 2 | Make the filter remember its value on reload | 99 | 11 | 940k | 0.454 | 1.1 |
| /kz-uiuxrule | before | 3 | Add a dark mode toggle | 95 | 7 | 727k | 0.394 | 0.4 |
| /kz-uiuxrule | before | 4 | The detail panel should close on Escape | 114 | 6.5 | 736k | 0.371 | 1.3 |
| /kz-uiuxrule | after | 1 | /kz-uiuxrule Build a single HTML page in index | 105 | 7 | 304k | 0.498 | 19.1 |
| /kz-uiuxrule | after | 2 | Make the filter remember its value on reload | 86 | 11 | 606k | 0.323 | 6.5 |
| /kz-uiuxrule | after | 3 | Add a dark mode toggle | 41 | 5.5 | 292k | 0.167 | 0.6 |
| /kz-uiuxrule | after | 4 | The detail panel should close on Escape | 70 | 9.5 | 522k | 0.267 | 1.4 |
| /kz-flashrule | after | 1 | /kz-flashrule Build a single HTML page in inde | 151 | 10.5 | 539k | 0.638 | 19.9 |
| /kz-flashrule | after | 2 | Make the filter remember its value on reload | 58 | 8.5 | 523k | 0.253 | 0.5 |
| /kz-flashrule | after | 3 | Add a dark mode toggle | 84 | 9 | 630k | 0.320 | 0.4 |
| /kz-flashrule | after | 4 | The detail panel should close on Escape | 40 | 3.5 | 280k | 0.143 | 0.2 |
| /kz-fastfix | after | 1 | Build a single HTML page in index | 117 | 11.5 | 455k | 0.546 | 9.5 |
| /kz-fastfix | after | 2 | /kz-fastfix Make the filter remember its value | 45 | 9 | 425k | 0.219 | 5.1 |
| /kz-fastfix | after | 3 | /kz-fastfix Add a dark mode toggle | 53 | 12.5 | 606k | 0.301 | 8.5 |
| /kz-fastfix | after | 4 | /kz-fastfix The detail panel should close on E | 38 | 4.5 | 344k | 0.168 | 6.9 |

#### Routing and asking

| condition | skills | runs | skills the model invoked (runs) | runs that asked | runs with a permission denial | runs that ran kz-uicheck | median kz-uicheck calls |
|---|---|---|---|---|---|---|---|
| none | - | 14 | dataviz (2); artifact-design (1) | 0 | 0 | 0 | 0 |
| /kz-uiuxrule | before | 14 | none | 1 | 0 | 14 | 4 |
| /kz-uiuxrule | after | 14 | none | 0 | 0 | 14 | 5.5 |
| /kz-flashrule | after | 14 | none | 0 | 0 | 12 | 3.5 |
| /kz-fastfix | after | 8 | kz-flashrule (2) | 0 | 0 | 6 | 2 |

### Blind judge, per task (kz preferred W-L-T)

| model | task | /kz-uiuxrule vs none | /kz-flashrule vs none |
|---|---|---|---|
| claude-sonnet-5-5 | chart-filter | 3-0-0 | 3-0-0 |
| claude-sonnet-5-5 | dark-mode | 0-0-3 | 1-0-2 |
| claude-sonnet-5-5 | form-build | 3-0-0 | 3-0-0 |
| claude-sonnet-5-5 | iterate-html | 1-2-0 | 1-2-0 |
| claude-sonnet-5-5 | small-column | 0-0-3 | 0-0-3 |
| claude-sonnet-5-5 | table-build | 0-3-0 | 1-2-0 |
| claude-sonnet-5-5 | trivial-label | 0-0-3 | 0-0-3 |
| claude-opus-5-5 | chart-filter | 2-0-0 | 2-0-0 |
| claude-opus-5-5 | dark-mode | 1-0-1 | 0-1-1 |
| claude-opus-5-5 | form-build | 0-2-0 | 0-2-0 |
| claude-opus-5-5 | iterate-html | 0-2-0 | 0-2-0 |
| claude-opus-5-5 | small-column | 0-0-2 | 0-0-2 |
| claude-opus-5-5 | table-build | 0-2-0 | 0-2-0 |
| claude-opus-5-5 | trivial-label | 0-1-1 | 0-1-1 |

Over all 70 comparisons the judge gave 21 to the kz page, 24 to none and called 25 ties.
It agreed with the rules on chart-filter, 10 of 10 to kz: a sorted bar per site with its total against six crossing monthly lines, and a filter whose effect is visible.
It agreed on Sonnet's form-build, 6 of 6 to kz: none's Sonnet forms were browser defaults or gave thinner error feedback.
It disagreed on table-build, 1 of 10 to kz: it prefers a visible bar of dropdowns and range fields to T1's per-column "All" buttons whose panels are hidden until opened.
It disagreed on iterate-html, 2 of 10 to kz: visible status chips with counts beat a "Status: All" button that opens a panel.
On Opus's form-build kz lost 4 of 4: none's Opus build showed a fuller confirmation, a receipt of what was sent.
The small edits were mostly ties (25 of 30 on trivial-label, small-column and dark-mode), as they should be.
Two Opus trivial-label verdicts named a winner while their reasons said the pages look the same; treat a single verdict as noise.
The judge sees screenshots and a scripted trace, not code, keyboard paths or screen-reader output, which is where most of the kz checks' findings live.
The five pairs in `scripts/bench/results/pairs/` (chart-filter, dark-mode, form-build, iterate-html, small-column; both lanes, both models, all three outcomes) are for a person to judge blind; `key.json` holds the answers, so open it last.

### What changed and why

1. **Scoped checks, run once** (the speed contract).
   Under `/kz-uiuxrule` the median tool time spent on kz files and checks fell from 26 s to 5 s per run on Opus, and from 11 s to 3 s on Sonnet.
   The number of check calls per run did not fall (Opus 4 to 5.5, Sonnet 1 to 2): each call is cheaper because it runs only the checks for what the change touched.
2. **The size test and the compressed SKILL.md files, with references read on demand.**
   Skill text read on trivial-label fell from 15.5 KB to 6.1 KB (Sonnet), and on Opus small-column from 30.6 KB to 6.6 KB: a small change no longer pulls in the rule slices.
3. **Nothing unasked.**
   On Opus, median output under `/kz-uiuxrule` fell from 17.6k to 9.6k tokens and lines added from 311 to 175; chart-filter went from 39 turns to 16.5.
4. **Light follow-ups.**
   Opus follow-ups under `/kz-uiuxrule` are faster (99, 95, 114 s to 86, 41, 70 s) but still 3 to 5 times none's, because they still re-run checks.
   Sonnet follow-ups under `/kz-uiuxrule` stay at 1.5 to 2.5 times none's (22, 21, 14 s against 9, 14, 8 s); under `/kz-flashrule` they match none (12, 13, 7 s).
5. **Routing.**
   With the skills merely installed, the model now picks a kz skill in 14 of 21 Sonnet runs (2 of 21 before): kz-flashrule for builds, kz-fastfix for edits, which is what the router asks for.
6. **T1 covers chart filters.**
   The chart-filter item "the site filter is a T1 panel" passes in every `after` /kz-uiuxrule run (3 of 3 Sonnet, 2 of 2 Opus), in Opus `/kz-flashrule` (2 of 2) and in 2 of 3 `installed` runs, and in no `before` or `none` run.
   table-check's CHARTBOX finding on chart-filter dropped to 0 in every `after` cell except one installed run.
   Sonnet `/kz-flashrule` built the panel in all three runs but without `aria-haspopup` on the trigger, so the item still fails there.
7. **What did not improve.**
   `/kz-fastfix` and `/kz-flashrule` on Opus still run the check suite several times, so on Opus they are no faster than `/kz-uiuxrule`.
   The blind judge prefers visible filter bars and chips to T1's per-column panels on tables and lists; the rules and a screenshot judge disagree there.

### Limits and what is unreliable

- Two or three runs per cell: enough to see 1.5x, not to rank 1.2x. Wall time includes API latency and machine load (one Sonnet `/kz-flashrule` table-build run took 553 s, 447 s of it inside tool calls, against 71 and 97 s for the other two).
- The harness changed (allow-listed `acceptEdits` instead of `bypassPermissions`, fixed starters, named models), which is why `before` was re-run rather than taken from the BEFORE section.
- The rubric is heuristic DOM probing. Two heuristics were widened after reading pages and their tasks re-scored for every condition; a few misses remain (a status filter with radios in one Sonnet `/kz-flashrule` run, and one Opus `/kz-fastfix` run that passed in one scoring and failed in the next).
- The dark-mode rubric did not discriminate: all 31 runs passed 6 of 6, so that task shows cost and judge differences only.
- Lighthouse saturates: accessibility is 1.00 for almost every page, and best-practices is 0.96 everywhere because a file-only page has no favicon. axe serious+critical is 0 to 2 per condition, too few to rank.
- The kz checks themselves vary by about one failure between scorings (modal-check), and one 390 run timed out at 600 s and was re-run.
- No run asked a question: the one flagged "asked" (Opus `/kz-uiuxrule` before, small-column) ended on suggestions, not a question.
- Spend: USD 62.77 for the 202 agent runs (USD 40.35 none and after, USD 22.42 before), USD 6.07 for 70 judge calls, and about USD 1.20 for harness tests; about USD 70 in all.

### Headline numbers for the README warning

Sonnet 5.5, against no skills:
- `/kz-uiuxrule`: 1.5x slower (2.5x before this change), 2.2x tokens, 1.9x cost; 0 check failures introduced against 50; the blind judge preferred it in 33% of pairs (7 won, 5 lost, 9 tied).
- `/kz-flashrule`: 1.4x slower, 1.6x tokens, 1.7x cost; 4 check failures introduced against 50; the judge preferred it in 43% of pairs (9 won, 4 lost, 8 tied).
- `/kz-fastfix` on small edits: 1.2x slower, 1.5x tokens and cost; 0 check failures introduced against 12; same rubric score.
- Installed, model chooses: 1.1x slower, 1.1x tokens, 1.3x cost; 8 check failures introduced against 50.

Opus 5.5, against no skills:
- `/kz-uiuxrule`: 1.7x slower (3.4x before this change), 1.9x tokens, 2.0x cost; 0 check failures introduced against 55; the judge preferred it in 21% of pairs (3 won, 7 lost, 4 tied).
- `/kz-flashrule`: 1.9x slower, 1.9x tokens, 1.8x cost; 0 check failures introduced against 55; the judge preferred it in 14% of pairs (2 won, 8 lost, 4 tied).
- `/kz-fastfix` on small edits: 1.7x slower, 1.7x tokens, 2.0x cost; 7.5 check failures introduced against 14.

Plainly: the skills cut measured defects to near zero at 1.5x to 2x the time and cost of no skills, half what they cost before this change on Opus; a screenshot judge does not see most of what they fix, and prefers visible filters to T1 panels.
