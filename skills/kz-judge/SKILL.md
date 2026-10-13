---
name: kz-judge
description: "Judges the UI rules a script cannot measure - does an error message say what went wrong and what to do next, does a button name its action, does an empty state say how to start, does a delete confirmation name what it deletes (K1, S2) - with a small decision model instead of the agent, so it costs the agent no tokens. Uses Jev (TypeSafe, needs TYPESAFE_API_KEY) or a local Laya install, and asks each engine only the questions it has passed on labelled examples. Skips cleanly when neither is present. Use after kz-uicheck on any page with messages, buttons, empty states or delete confirmations. Triggers on \"/kz-judge\", \"judge the copy\", \"check the wording\", \"check error messages\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-judge

`kz-uicheck` measures what a script can measure. Some rules are judgements about words: "errors say what
to do next", "buttons name the verb", "a confirmation names what it deletes". Asking the agent to judge
them costs its tokens and its attention. This hands them to a small decision model that answers typed
yes/no questions about text, and only the findings come back.

```bash
python scripts/judge.py engines              # what this machine has
python scripts/judge.py check page.html      # judge a page; advisories, exit 0
python scripts/judge.py check page.html --strict    # exit 1 on findings (CI, pre-commit)
python scripts/judge.py calibrate            # re-run the labelled examples
```

## Engines, and why one may be asked nothing

| Engine | Needs | Cost | |
|---|---|---|---|
| `jev` | `TYPESAFE_API_KEY` | about $0.04 per million input tokens; a page is a few hundred to a few thousand tokens | Tried first. **The page's text is sent to api.typesafe.ai**: use `--engine laya` to keep it on the machine |
| `laya` | a local install of [Laya](https://github.com/NandhaKishorM/laya) (`LAYA_PYTHON`, or found in its usual place) | free, offline; minutes to load cold | The fallback |
| none | | | Prints "judge skipped" and passes. Nothing else depends on this skill |

Every question in `scripts/questions.py` carries labelled good and bad examples. Before an engine is asked
a question on a real page, it must sort every example to the right side of the threshold, with a margin
(`calibrate`; the result is cached in `~/.kz/judge-calibration.json` and redone when the questions, the pinned model or the margin change).
**An engine that fails a question is not asked it**: its answer would be noise dressed as a finding, and the
report says which questions were not asked.

Each text is judged in its own request, with nothing else in the state, so one string on the page cannot
steer the answer about another, and the trust earned in calibration is earned the same way.

Measured on 12 October 2026, one text per request: Jev (`jev-1.13.0`) passed all four questions, good
>= 0.90 and bad <= 0.17. Without its true/false criteria the button question did not pass (a bad label at
0.49), which is why criteria are there. Laya 0.3.20 passed none of the four, with or without criteria, so
with Laya alone the judge asks nothing. That is the gate working, not a fault in the skill: re-run
`calibrate` after a Laya update.

Exit codes: 0 judged (findings are advisories), 1 findings under `--strict`, 2 nothing could be judged
under `--strict` (no engine, or no trusted question) or a named engine is missing.

## What it reads, and its limits

Headless Chrome reads the page's text: error and alert text, visible button labels (not sort buttons in a
table head, which are named by their column), empty-state text, and dialogs that mention delete, remove,
clear, reset, wipe or discard. Mark an element `data-judge="skip"` to leave it out.

- **Text only.** It cannot see the page: "one thing wins", spacing and contrast stay with `kz-uicheck`.
- **Probabilities, not facts.** Findings are advisories by default. Use `--strict` only where the questions
  have been calibrated on your own wording.
- **Text that only exists after an event** (an error added by script on submit) is not read unless it is
  already in the page, hidden or not.

## Adding a question

Add it to `scripts/questions.py`: phrased so that yes means good, one condition, the rule ID, a threshold,
true/false `criteria` when the text is short, and at least four good and four bad examples written the
way the product writes. Run `calibrate`. If an
engine cannot separate the examples, reword the question (Jev reads words literally: "deleted or removed"
did not cover "clear" until the question said so) or leave it for that engine.
