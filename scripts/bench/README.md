# Skill benchmark

Measures what the kz skills cost in time, tokens and money on ordinary single-file HTML work,
and what they buy in quality. Run it before a change to the skills and again after, and compare.

**It spends real money.** Each run is a headless `claude -p` session on your account. The
AFTER run in `docs/benchmark.md` (202 agent runs on two models, plus 70 judge calls) cost the
amount stated there. `run.py` stops launching new runs once the total passes `--budget`
(default USD 40), each `claude` call carries `--max-budget-usd` (`--run-budget`, default 8),
and `judge.mjs` stops at its own `--budget` (default USD 25).

## What it does

- `tasks/<id>/` - a prompt (`prompt.md`) and a starter project (`index.html`, data inline).
  `iterate-html` also has `followups.json`: three short follow-ups sent in the same session with
  `--resume`, to time the iteration loop turn by turn. Every starter passes the kz checks with
  0 failures at 1280 and 390, so a failure in a result is one the agent introduced.
  Seven tasks: `trivial-label`, `small-column`, `dark-mode` ("Add a dark mode toggle" to a page
  with a table, a form and a chart), `table-build`, `chart-filter`, `form-build`, `iterate-html`.
  The first three and `iterate-html` are the small tasks (`SMALL_TASKS`).
- `run.py` - copies each task into a fresh git repo, gives it a fresh `CLAUDE_CONFIG_DIR`, and
  runs `claude -p "<prompt>" --output-format json --permission-mode acceptEdits --allowedTools ...`
  (file tools, Skill, subagents and Bash; no web tools; the same for every condition).
  Conditions:
  - `none`: an empty config dir. No skills, no hooks. Runs once per model, version `-`.
  - `installed`: `skills/*` copied into `<config>/skills/`, and the purpose hook wired on
    `PreToolUse` (matcher `Skill`) and `UserPromptSubmit`, as `skills/kz-askcard/hooks/README.md`
    says. The model decides whether to use a skill. (`kz` in the BEFORE file.)
  - `uiuxrule`, `flashrule`: the same install, the first prompt sent as `/kz-uiuxrule <prompt>`
    or `/kz-flashrule <prompt>`. (`kz-slash` in the BEFORE file is `uiuxrule`.)
  - `fastfix`: the same install, small tasks only, the prompt sent as `/kz-fastfix <prompt>`. On
    `iterate-html` the build prompt goes bare and each follow-up as `/kz-fastfix <follow-up>`.
  Versions (`--versions`): `after` installs this working tree's `skills/`; `before` installs
  `skills/` as on `--before-ref` (default `origin/main`), extracted read-only with `git archive`.
  `--plan full` is the AFTER matrix (`FULL_PLAN` in `run.py`): Sonnet 3 runs per cell for none,
  installed and /kz-uiuxrule on both versions, /kz-flashrule and /kz-fastfix on `after`; Opus 2
  runs per cell for none, /kz-uiuxrule on both versions, /kz-flashrule and /kz-fastfix on `after`.
  Fairness: repeat k of every cell runs in round k, and each round is shuffled with `--seed`, so
  conditions, versions and models interleave; `--jobs` (default 3) run at once. Each run records
  its start time, CLI version, requested model and the model ids the CLI reports.
  Modes:
  - `scored`: the prompt plus "If you would ask me something, assume the recommended option and
    proceed." (all conditions), so every run finishes.
  - `probe` (`--probe`): the bare prompt with `--max-turns 8`, to see whether the agent stops to
    ask. A run counts as asked if it called `AskUserQuestion` or its final message is a question.
  It records wall seconds, `duration_api_ms`, turns, input, output, cache write and cache read
  tokens, `tokens_total` (their sum, independent of cache hits), cost (cache-dependent), files
  changed against the starter commit, permission denials, and the kz skill text that entered the
  context, parsed from the transcript under `<config>/projects/`. Resumed turns are stored as
  per-turn deltas. The results file is rewritten after every run.
- `score.mjs` - for each scored run, the same for every condition:
  `kz-uicheck/scripts/run-checks.py` at 1280px and 390px (both colour schemes, so up to 20 check
  runs per width) and the failures introduced (run minus starter); a rubric of 5 or 6 binary
  items per task checked in the DOM with Playwright (the chart-filter T1 item uses
  `table-check.js`'s own CHARTBOX definition); axe-core violations by impact at 1280 and 390;
  Lighthouse accessibility and best-practices at mobile, over a local http server.
  The untouched starters are scored too (`starters` in the file).
- `judge.mjs` - blind pairwise judge. For each model, task and repeat k it pairs `none` with
  `after` /kz-uiuxrule and with `after` /kz-flashrule. Each page gets a full-page screenshot at
  1280 and 390 and a strip of frames from a short scripted interaction (open the filter, tick a
  value, submit the empty form, flip the theme; `STEPS` per task). Sides are shuffled (seeded) and
  named A and B only; `claude -p --model claude-opus-5-5 --tools Read` in an empty config dir
  answers which a real user would find better, as JSON `{winner, reasons}`. `--save 5` copies
  five representative pairs to `results/pairs/` for a person to judge blind; the answer key is
  `results/pairs/key.json`, so do not open it first.
- `report.py` - prints the Markdown tables used in `docs/benchmark.md` from one or more results
  files and a judge file, and times the tool calls that touched the kz skills from transcripts.

## Running it

```bash
# tools for score.mjs, pinned (or let it fall back to npx)
npm install --prefix /tmp/kzb-tools axe-core@4.10.3 lighthouse@12.8.2

# the AFTER matrix, then score, judge and print the tables
python scripts/bench/run.py --plan full --label full --budget 140 --no-score
node scripts/bench/score.mjs scripts/bench/results/full-<date>.json
node scripts/bench/judge.mjs scripts/bench/results/full-<date>.json --save 5
python scripts/bench/report.py scripts/bench/results/full-<date>.json --judge scripts/bench/results/judge-<date>.json

# one cell, or a custom matrix
python scripts/bench/run.py --tasks chart-filter --conditions none,uiuxrule --versions before,after --model claude-sonnet-5-5
python scripts/bench/run.py --plan full --dry-run          # print the shuffled launch order only

# score again
RESCORE=1 ONLY_TASK=dark-mode node scripts/bench/score.mjs scripts/bench/results/<file>.json
```

Needs: the `claude` CLI logged in, `git`, Python 3, Node, Playwright (`PLAYWRIGHT`), a Chrome
or Chromium for the checks and screenshots (`CHROME`, the headless shell is enough) and a full
Chromium for Lighthouse (`CHROME_PATH`), axe-core and lighthouse under `KZ_BENCH_TOOLS`
(default `/tmp/kzb-tools`). The child runs get `CHROME` too, so `kz-uicheck` can run there as
it would on a user's machine. Work dirs go under `--work` (default `/tmp/kzb`) and are kept, so
a run's output and transcript can be inspected afterwards; the judge needs them.

Name the model with `--model` or `--plan full`; the CLI default changes over time.

## Reading the results

`results/<label>-<date>.json` holds every run (the AFTER batch was written as one file and split by
skill version into `after-2026-10-14.json` and `before-v2-2026-10-14.json`; `report.py` takes both): totals, a `turns` list (one entry per prompt),
`skill_reads` (which kz files, how many bytes), `files_changed`, and `score` (check failures
per check and width, failures introduced, rubric items with pass or fail, axe, Lighthouse).

- **Wall time, tokens and cost factors** are per task: the cell's median over `none`'s median
  for the same model, then the median over tasks, with the range over tasks. Wall time includes
  model latency, which is noisy run to run; look at the range and at `num_turns` and
  `tokens_total` before calling a difference real. Cost depends on cache hits; tokens do not.
- **Check failures** count failing check runs (check x colour scheme) that the starter did not
  have. A page that fails the same check in light and dark counts 2.
- **Rubric** items are written to be checkable without judgement. A heuristic that cannot find
  the control it looks for scores a fail: read the item's name and open the page before
  concluding the agent got it wrong.
- **Judge** win rate is the share of comparisons the judge gave to the kz side; ties count as
  not won. It judges screenshots and a scripted trace, not the code.
- **Asked** is from probe runs, or a scored run that called `AskUserQuestion` or ended on a
  question. Scored runs are told to assume the recommended option.
