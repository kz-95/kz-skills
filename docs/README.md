# Documentation index

One row per document: what it covers, what kind of document it is, and **when to reach for it**. Kinds: **Rules** are confirmed and binding on the skills; **Guide** explains how to use something; **Reference** is looked up, not read through; **Record** is history and carries no authority.

| Document | Kind | Covers | Reach for it when |
|---|---|---|---|
| [install.md](install.md) | Guide | Installing in Claude Code (plugin and by hand) and in other agents; wiring the purpose hook; fixing "it does not show up" | You are setting this up, or a skill is not appearing as a command |
| [how-they-fit.md](how-they-fit.md) | Guide | The eight skills, what each is for, and how a request is routed between them | You are not sure which skill a task needs |
| [with-impeccable.md](with-impeccable.md) | Guide | Using these skills alongside impeccable (a style skill): who decides what, where they agree, the three places they can pull against each other | You want a style from impeccable and correct behaviour from here |
| [rule-index.md](rule-index.md) | Reference | Every rule, one line each, by category, with links to its live samples. **Generated** by `scripts/build-index.py` | You want to scan all rules, or find one by its statement |
| [reference/ui-rules-visual.html](reference/ui-rules-visual.html) | Reference | A wrong and a right sample for every rule, live | You want to see a rule fail and pass |
| [reference/README.md](reference/README.md) | Guide | The reference page and the two checks bound to it | You are running the checks against the reference page |
| [assets/](assets/) | Reference | `carousel-de-ai.gif`, `carousel-improvements.gif`, `carousel-charts.gif` (the README pictures: fifteen common agent mistakes, wrong then right, in three short loops, one per category) and `carousel-poster.png` (the social preview). **Generated** from the live reference page by `scripts/make-carousel.py` | A rule's sample changed and the picture must follow; run the script |
| [history/SKILL-REVIEW.md](history/SKILL-REVIEW.md) | Record | The review that produced the current `kz-crew021` | You want to know why the crew workflow reads the way it does |
| [history/diagrams/](history/diagrams/) | Record | The workflow diagram `kz-crew021` was built from | You want the shape of the workflow at a glance |

## The rules themselves are not here

They live inside the skills, in one place each, so a copy here could not drift:

| Where | What |
|---|---|
| [`skills/kz-uiuxrule/rules/INDEX.md`](../skills/kz-uiuxrule/rules/INDEX.md) | The keyword router: task words to the sections that apply. **Start here for any UI task.** |
| [`skills/kz-uiuxrule/rules/ui-rules.md`](../skills/kz-uiuxrule/rules/ui-rules.md) | The UI rules by category, with appendices and the 25 lessons |
| [`skills/kz-uiuxrule/rules/chart-rules.md`](../skills/kz-uiuxrule/rules/chart-rules.md) | The 21 chart rules |
| [`skills/kz-uiuxrule/rules/design-principles.md`](../skills/kz-uiuxrule/rules/design-principles.md) | The 16 principles behind the rules |
| [`skills/kz-engrules/rules/engineering-rules.md`](../skills/kz-engrules/rules/engineering-rules.md) | The engineering rules under every task |

## Outside this repository

Nothing. Everything the skills cite is in this repository, except `SKILL-REVIEW.md` and `diagrams/`, which are in `history/` here but are **not** carried by an installed copy of a skill.

## Open questions

- Whether the purpose hook should ship inside the plugin. It needs a live install to test, so it is documented rather than wired for now.
