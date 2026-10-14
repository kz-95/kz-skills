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
