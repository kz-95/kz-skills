# Skill benchmark

Measures what the kz skills cost in time, tokens and money on ordinary single-file HTML work,
and what they buy in quality. Run it before a change to the skills and again after, and compare.

**It spends real money.** Each run is a headless `claude -p` session on your account. The
BEFORE run in `docs/benchmark.md` (6 tasks x 3 conditions x 2 repeats, plus a probe of each)
cost the amount stated there. `run.py` stops launching new runs once the total passes `--budget`
(default USD 40), and each `claude` call carries `--max-budget-usd` (`--run-budget`, default 8).

## What it does

- `tasks/<id>/` - a prompt (`prompt.md`) and a starter project (`index.html`, data inline).
  `iterate-html` also has `followups.json`: three short follow-ups sent in the same session with
  `--resume`, to time the iteration loop turn by turn.
- `run.py` - copies each task into a fresh git repo, gives it a fresh `CLAUDE_CONFIG_DIR`, and
  runs `claude -p "<prompt>" --output-format json --permission-mode bypassPermissions`.
  Conditions:
  - `none`: an empty config dir. No skills, no hooks.
  - `kz`: `skills/*` copied into `<config>/skills/`, and the purpose hook wired on
    `PreToolUse` (matcher `Skill`) and `UserPromptSubmit`, as `skills/kz-askcard/hooks/README.md`
    says. The model decides whether to use a skill.
  - `kz-slash`: the same install, with the first prompt sent as `/kz-uiuxrule <prompt>`.
  Modes:
  - `scored`: the prompt plus "If you would ask me something, assume the recommended option
    and proceed." (both conditions), so every run finishes.
  - `probe` (`--probe`): the bare prompt with `--max-turns 8`, to see whether the agent stops to
    ask. A run counts as asked if it called `AskUserQuestion` or its final message is a question.
  It records wall seconds, `duration_api_ms`, turns, tokens, cost, files changed, and the kz
  skill text that entered the context (skill bodies loaded, kz files read, and the output of
  commands run on kz paths), parsed from the transcript under `<config>/projects/`.
- `score.mjs` - for each scored run: `kz-uicheck/scripts/run-checks.py` at 1280px and 390px
  (both colour schemes, so up to 20 check runs per width) and a rubric of 5 or 6 binary items
  per task, checked in the DOM with Playwright. Same scoring for every condition.
- `report.py` - prints the Markdown tables used in `docs/benchmark.md`, and times the tool
  calls that touched the kz skills from the transcripts.

## Running it

```bash
# all tasks, all conditions, one scored run each, plus the ask probe; then score
python scripts/bench/run.py --probe

# two of everything, three in parallel, a different label for the file name
python scripts/bench/run.py --probe --repeat 2 --jobs 3 --label after

# one cell
python scripts/bench/run.py --tasks chart-filter --conditions none,kz-slash

# score again, or print the tables
RESCORE=1 node scripts/bench/score.mjs scripts/bench/results/after-<date>.json
python scripts/bench/report.py scripts/bench/results/after-<date>.json
```

Needs: the `claude` CLI logged in, `git`, Python 3, Node, Playwright, and a Chrome or Chromium
(`CHROME`). The child runs get `CHROME` too, so `kz-uicheck` can run there as it would on a
user's machine. Work dirs go under `--work` (default `/tmp/kzb`) and are kept, so a run's
output and transcript can be inspected afterwards. Inside a sandboxed agent shell, run it
outside the sandbox: a sandboxed parent can make a child's file writes vanish.

Use the CLI's default model for both BEFORE and AFTER, or say which model in the report.

## Reading the results

`results/<label>-<date>.json` holds every run: totals, a `turns` list (one entry per prompt),
`skill_reads` (which kz files, how many bytes), `files_changed`, and `score` (check failures
per check and width, rubric items with pass or fail).

- **Slowdown** is the kz condition's median wall time over `none`'s, per task, then the median
  over tasks. Wall time includes model latency, which is noisy run to run; look at the range
  and at `num_turns` and tokens before calling a difference real.
- **Check failures** count failing check runs (check x colour scheme). A page that fails the
  same check in light and dark counts 2.
- **Rubric** items are written to be checkable without judgement. A heuristic that cannot find
  the control it looks for scores a fail: read the item's name and open the page before
  concluding the agent got it wrong.
- **Asked** is from probe runs only. Scored runs are told to assume the recommended option.
