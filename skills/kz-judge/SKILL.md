---
name: kz-judge
description: "Judges the UI rules a script cannot measure - does an error message say what went wrong and what to do next, does a button name its action, does an empty state say how to start, does a delete confirmation name what it deletes (K1, S2) - with a small decision model instead of the agent, so it costs the agent no tokens. Uses a local Laya install, so nothing leaves the machine, and asks it only the questions it has passed on labelled examples. Skips cleanly when Laya is not present. Use after kz-uicheck on any page with messages, buttons, empty states or delete confirmations. Triggers on \"/kz-judge\", \"judge the copy\", \"check the wording\", \"check error messages\"."
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

## The engine, and why it may be asked nothing

| Engine | Needs | Cost | |
|---|---|---|---|
| `laya` | a local install of [Laya](https://github.com/NandhaKishorM/laya) (`pip install laya`; `LAYA_PYTHON`, or found in its usual place) | free, offline; minutes to load cold | The page's text stays on the machine. Laya downloads its checkpoint from Hugging Face on first use |
| none | | | Prints "judge skipped" and passes. Nothing else depends on this skill |

Every question in `scripts/questions.py` carries labelled good and bad examples. Before Laya is asked
a question on a real page, it must sort every example to the right side of the threshold, with a margin
(`calibrate`; the result is cached in `~/.kz/judge-calibration.json` and redone when the questions or the margin change).
**A question the engine fails is not asked**: its answer would be noise dressed as a finding, and the
report says which questions were not asked.

Each text is judged as its own state, with nothing else in it, so one string on the page cannot steer the
answer about another, and the trust earned in calibration is earned the same way.

Measured one text per state: Laya 0.3.20 (12 October 2026) passed none of the four questions, with or
without criteria, and neither did Laya 0.4.17 (`laya-english`, 29 October 2026), so the judge asks nothing. That is the gate working, not a fault in the skill: re-run
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
way the product writes. Run `calibrate`. If the
engine cannot separate the examples, reword the question (a small model reads words literally: "deleted or
removed" did not cover "clear" until the question said so) or leave it unasked.
