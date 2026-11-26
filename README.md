# kz-skills: UI rules for AI coding agents, with checks that measure them

**Your agent learns what any interface must do, what breaks when it does not, and runs a browser check that proves it.**

<a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html"><img src="docs/assets/hero.gif" alt="kz-skills, set as a poster headline on a blue panel: UI rules for AI coding agents, each with a browser check that measures it. Tables, rule T1: a bare text box under each column, table-check.js reports BOX (3 of 3 column filters are a bare text box), the filters become buttons with an open value panel, and the check reports no failures. Contrast, rule Y2, dark theme: a card label at 1.05:1, contrast-check.js reports LOW in dark, the label takes the dark-theme token at 7.84:1, and the check is clean in both themes. Charts, rule C5: a focused donut wedge ringed by its bounding box, layout-audit.js reports FOCUS BOX, the ring follows the wedge and shows its value, and the audit is clean. Diagrams, rule G6: the WRITE label sits on its line, diagram-check.js reports LABEL ON LINE, the label moves beside the line, and the check is clean. Closing card: 94 rules. 12 checks. Any stack. npx skills add kz-95/kz-skills." width="100%"></a>

94 rules (57 UI, 6 motion, 21 chart, 10 diagram) and 16 principles, in thirteen skills, with twelve browser checks.
A 2 KB lookup sends each type of work to one short generated pack: the rules it needs, a snippet to start from and the exact checks to run.
Stack-neutral and style-neutral: they work with any framework and any look.
Plain Markdown, so any agent that reads files can use them.

## Install

```bash
npx skills add kz-95/kz-skills
```

The [`skills` CLI](https://skills.sh) finds every skill in this repository and installs it into the skills folder of each agent you pick (Claude Code, Cursor, Codex and others).
Add `-l` to list the skills without installing, or `--skill kz-uiuxrule` to take one.

In Claude Code, as a plugin:

```text
/plugin marketplace add kz-95/kz-skills
/plugin install kz-skills@kz-skills
```

From a terminal, the same two steps are `claude plugin marketplace add kz-95/kz-skills` and `claude plugin install kz-skills@kz-skills`.
The plugin installs and enables all thirteen skills.
Then `/kz-flashrule` for everyday UI building, `/kz-uiuxrule` for reviews and audits, or `/kz-skill` if you are not sure which one.

> **Warning: these skills cost time and tokens, on purpose.**
> The agent reads rules and runs browser checks before it calls UI work done.
> Measured with `/kz-uiuxrule` on eight tasks: 1.6x the time and 1.5x the tokens on Sonnet 5.5, 2.0x and 1.9x on Opus 5.5, in exchange for every rubric item passed and 8 and 2.5 check failures introduced against 48 and 54 without the skills.
> When speed matters, call the lighter lane: `/kz-fastfix` for a one-line edit, `/kz-flashrule` for everyday building (1.4x the time and 1.3x to 1.4x the tokens on both models).
> Details and limits: [Measured](#measured-speed-tokens-and-quality).

<details>
<summary><b>Claude Code</b>, by hand (macOS, Linux, Windows)</summary>

```bash
git clone https://github.com/kz-95/kz-skills.git
cp -r kz-skills/skills/* ~/.claude/skills/
```

On Windows PowerShell:

```powershell
git clone https://github.com/kz-95/kz-skills.git
Copy-Item kz-skills\skills\* $HOME\.claude\skills -Recurse
```

Each skill must land as a **direct** child of `skills/`.
A skill nested inside another folder is not registered, and will not appear as a command.

</details>

<details>
<summary><b>GPT, Codex, Cursor</b> and other agents</summary>

The skills are plain Markdown.
Point your agent at [`AGENTS.md`](AGENTS.md), which tells any agent how to use them, and at [`llms.txt`](llms.txt), the index for crawlers and file-reading models.
[`docs/install.md`](docs/install.md) has the details per host.
The checks are `.js` files you paste into a browser console, so they need no host at all.

</details>

<details>
<summary><b>Only part of it</b></summary>

`npx skills add kz-95/kz-skills --skill kz-diagramrule` takes one skill.
`kz-uiuxrule` links to `kz-engrules`, `kz-askcard` and `kz-uicheck` as siblings, so install those four together if you want the rules without the crew.

</details>

[Live reference](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html) | [All 94 rules](docs/rule-index.md) | [For agents: llms.txt](llms.txt) | [Changelog](CHANGELOG.md)

**On this page:** [Ask in plain words](#ask-your-agent-in-plain-words) | [Why](#why-this-exists) | [What it covers](#what-it-covers) | [How it compares](#how-it-compares) | [Measured](#measured-speed-tokens-and-quality) | [The skills](#the-thirteen-skills) | [What loads when](#what-loads-when) | [Most missed](#the-rules-most-often-missed) | [FAQ](#faq) | [Contributing](#contributing) | [License](#license)

---

## Ask your agent in plain words

- *"Build a table of orders with filters."*
- *"Review this signup form."*
- *"Is this chart right?"*
- *"Draw the checkout flow as a diagram."*
- *"Make this page work on a phone."*

The agent sizes the request first, reads only the rules that fit it (one page for everyday work, two or three rule sections when that page is not enough), builds or reviews against them, quotes the rule IDs it applied, and runs the checks for what it changed before it says the work is done.
You never have to name a rule or a skill.

## Why this exists

AI agents ship the same interface mistakes, confidently, and a screenshot rarely shows them.
These five are real, from building this repo:

| What the agent shipped | Rule | The check that fails it |
|---|---|---|
| A filter row that is an **empty typed box under every column**, where a button opening a value list with counts belongs | `T1`, `S1` | `table-check.js` |
| A focus ring that is a **rectangle round a curved chart wedge** | `C5` | `layout-audit.js` (`FOCUS BOX`) |
| A search field that **re-renders on every keystroke**, so the phone keyboard closes after one letter | `F8` | `typing-check.js` |
| A label that is **dark on dark, 1.04:1**, in the dark theme only | `Y2` | `contrast-check.js` (both themes) |
| A filter panel that **only opens**: tap its button again and nothing closes it, and a phone has no Escape | `N2` | `popover-check.js` |

Each rule states the obligation, the failure that follows when it is missed, and the check that catches it.
That second part is the point: an agent told only "do X" drops X the first time it is inconvenient, while an agent told what breaks without X keeps it.
Where two approaches compete, the rule says why this one and not that one, so the agent does not reopen a settled question.

A rule with no check gets broken by the person who wrote it.
That happened repeatedly while these were written, and each case is recorded as a habit to have (26 lessons, [Appendix Z](skills/kz-uiuxrule/rules/ui-rules.md)).

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/banners/covers-dark.png"><img src="docs/assets/banners/covers-light.png" alt="Wrong / right" width="640"></picture></p>

## What it covers

One right sample per category, from the [live reference page](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html).
Every rule there has a wrong half beside it, and a check asserts the wrong half still fails.

<table>
<tr>
  <td align="center" width="50%"><a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#t1-filter"><img src="docs/assets/gallery/tables.webp" alt="Tables: a search box, a row count, and a filter on every column header including the computed Share column"></a><br><b>Tables (T)</b><br><sub>A filter is a panel per column, never a text box</sub></td>
  <td align="center" width="50%"><a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#f1-nudge"><img src="docs/assets/gallery/forms.webp" alt="Forms: required fields marked with an asterisk before anything is missed, an optional field labelled optional"></a><br><b>Forms (F)</b><br><sub>Required is said before it is missed; typing is never interrupted</sub></td>
</tr>
<tr>
  <td align="center"><a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#c5-ring"><img src="docs/assets/gallery/charts.webp" alt="Charts: a donut chart whose selected wedge has a ring tracing its own curved outline"></a><br><b>Charts (C)</b><br><sub>A highlight follows the mark, not a box round it</sub></td>
  <td align="center"><a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#g3-lines"><img src="docs/assets/gallery/diagrams.webp" alt="Diagrams: Ingest routed to Queue and Store with square lines, rounded bends and a port each"></a><br><b>Diagrams (G)</b><br><sub>Square routes, one port per line, labels beside the line</sub></td>
</tr>
<tr>
  <td align="center"><a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#m3-origin"><img src="docs/assets/gallery/motion.webp" alt="Motion: an Options menu opening from its button"></a><br><b>Motion (M)</b><br><sub>A panel grows from its trigger, never from scale(0)</sub></td>
  <td align="center"><a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#l1-hierarchy"><img src="docs/assets/gallery/layout.webp" alt="Layout: an outstanding balance where the amount is the one large thing and its labels step back"></a><br><b>Layout (L)</b><br><sub>One thing wins and everything else steps back</sub></td>
</tr>
<tr>
  <td align="center"><a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#n2-close"><img src="docs/assets/gallery/overlays.webp" alt="Overlays: an open filter panel with a Done button, one of four ways to close it"></a><br><b>Overlays (N)</b><br><sub>Every panel closes four ways, including on a phone</sub></td>
  <td align="center"><a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#y2-plate"><img src="docs/assets/gallery/type-colour.webp" alt="Type and colour: an amount on a white plate over a light-to-dark gradient, readable everywhere"></a><br><b>Type and colour (Y)</b><br><sub>Text over a changing background gets a contrast decision</sub></td>
</tr>
</table>

Also on the page: [Typing on a phone](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#f8-typing) | [Every rule, wrong beside right](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html)

## More mistakes agents make

**De-AI: what makes an interface look machine-made**

<a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#l1-hierarchy"><img src="docs/assets/carousel-de-ai.gif" alt="Five de-AI mistakes, each shown wrong, then right. L1: one thing wins and everything else steps back. B1: icon first, a label that fits. L5: controls in a row share one height. Y2: label contrast is a decision. B4: everything that acts answers the pointer." width="100%"></a>

**Usability**

<a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#t1-filter"><img src="docs/assets/carousel-improvements.gif" alt="Five usability mistakes, each shown wrong, then right. T1: a filter is a panel, not a text box. F1: a required field says so before it is missed. F4: a field is the shape of what goes in it. N2: a panel can always be closed. F9: Enter moves to the next field." width="100%"></a>

**Charts**

<a href="https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#c5-ring"><img src="docs/assets/carousel-charts.gif" alt="Five chart rules. C5: a highlight follows the mark, not a box round it, shown wrong then right. Then four shown working: C5, select a mark and it shows its values; C6, aggregate with the right operation for the measure; C12, a chart type keeps the marks that define it; C4, a time chart ships range presets and derives its granularity." width="100%"></a>

## How it compares

| | No rules | A style skill, such as impeccable | kz-skills |
|---|---|---|---|
| What it decides | Whatever the model guesses | How the interface looks: type, colour, spacing, tone | What the interface must do: filters, closing, typing, focus, routes, contrast |
| "Build a table with filters" gives you | A text box under each header, most of the time | A good-looking text box under each header | A filter button per column, opening a panel with a value list and counts (`T1`) |
| How a mistake is caught | You notice it, later | You notice it, later | A paste-in browser check fails, with a code and a measurement |
| Why the agent keeps to it | It does not | Taste, which is easy to argue with | Each rule names the failure it prevents, so dropping it has a visible cost |
| Stack and look | Any | Its own look | Any stack, any look; your design system wins on style |
| Charts and diagrams | Whatever the library draws | Styled | 21 chart rules and 10 diagram rules, each with a check |

The two kinds mix well: the style skill decides how it looks, kz-skills decides what must happen, and the rules win where the two conflict ([how they combine](docs/with-impeccable.md)).

The downsides are real:

- **It does not pick a look.** There is no palette, typeface or component library here, so pair it with your design system or a style skill.
- **The checks need a browser.** They are console scripts that measure the rendered page; a screenshot or a code review cannot run them, and hover, press and focus states need the live page.
- **It is slower than no rules.** Reading rules and running checks takes time and tokens; [Measured](#measured-speed-tokens-and-quality) says how much.

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/banners/measured-dark.png"><img src="docs/assets/banners/measured-light.png" alt="Measured" width="640"></picture></p>

## Measured: speed, tokens and quality

The current skills (type routing: one lookup, one pack per type of work, twelve checks) were measured against no skills and against the skills just before type routing, on eight single-file HTML tasks: a label change, a new column, a dark mode toggle, a table, a chart filter, a form, a delete with Undo and a save confirmation, and a build with three follow-ups.
Each run was a fresh headless Claude Code 2.1.329 session on a named model, three runs per task on Sonnet 5.5 and two on Opus 5.5, 228 runs in one shuffled batch.
A factor is the lane's median over the no-skill median for the same task and model, then the median over tasks.
A check failure introduced is a failing `kz-uicheck` check run (check x colour scheme, at 1280px and 390px) that the starter page did not have; the number in brackets is no skills on the same tasks.
The rubric is a DOM probe of what each request asked for, 43 items over the eight tasks.

**Sonnet 5.5** (`claude-sonnet-5-5`)

| Lane | Tasks | Time vs no skills, before -> now | Tokens vs no skills, before -> now | Rubric, now (no skills) | Check failures introduced, now (no skills) |
|---|---|---|---|---|---|
| `/kz-uiuxrule` | 8 | 1.31x -> 1.63x | 1.42x -> 1.46x | 43/43 (37) | 8 (48) |
| `/kz-flashrule` | 8 | 1.35x now | 1.43x now | 43/43 (37) | 8 (48) |
| `/kz-fastfix` | 4 | 1.50x now | 1.76x now | 22/22 (22) | 0 (10) |
| Installed, the model chooses | 8 | 1.07x -> 1.41x | 1.09x -> 1.46x | 42/43 (37) | 9 (48) |

**Opus 5.5** (`claude-opus-5-5`)

| Lane | Tasks | Time vs no skills, before -> now | Tokens vs no skills, before -> now | Rubric, now (no skills) | Check failures introduced, now (no skills) |
|---|---|---|---|---|---|
| `/kz-uiuxrule` | 8 | 1.45x -> 1.95x | 1.61x -> 1.90x | 43/43 (38.5) | 2.5 (54) |
| `/kz-flashrule` | 8 | 1.37x now | 1.27x now | 43/43 (38.5) | 8 (54) |
| `/kz-fastfix` | 4 | 1.51x now | 1.70x now | 22/22 (22) | 1 (14) |

Type routing did not make the skills faster.
It moved the reading from one core file to a lookup, a pack and the pack's snippet, which costs about the same on small work and more on toast and table work, where the snippets run 8 to 15 KB.
It raised the rubric to full marks in every lane, and cut failures introduced on Opus 5.5 (5 to 2.5) but not on Sonnet 5.5 (2 to 8).
With the skills only installed, Sonnet 5.5 called kz-fastfix in 11 of 24 runs and kz-flashrule in 4, against 4 and 4 before.
A blind screenshot judge (Opus 5.5) gave 23 of 80 pairs to the kz page, 34 to no skills and called 23 ties.
It sided with the kz page on the chart filter and Sonnet's form, and with no skills on the table build and on the new toast task, where it preferred a dark toast that also announces a field save to the kz pages' inline "Saved" note.

Every table, the method and the limits: [`docs/benchmark.md`](docs/benchmark.md).
To run it again, before and after a change of your own: [`scripts/bench/README.md`](scripts/bench/README.md); it spends real money on your account.

---

## The thirteen skills

Each skill, and when to reach for it:

- **[`kz-skill`](skills/kz-skill/SKILL.md)**: A request spans several of these, or it is unclear which applies. The router, and the home of the speed contract: size the change first, then read and check only what it touches.
- **[`kz-uiuxrule`](skills/kz-uiuxrule/SKILL.md)**: Reviews, audits, larger UI work and "make it production": the rules, in four modes (adopt, review, build, loop). Everyday building starts from `kz-flashrule` instead.
- **[`kz-motionrule`](skills/kz-motionrule/SKILL.md)**: Work that only moves - an animation, a transition, a press effect: the six motion rules and their check, without the rest of the corpus.
- **[`kz-diagramrule`](skills/kz-diagramrule/SKILL.md)**: Only a diagram: boxes, lines and labels - the ten diagram rules and their check, without the rest of the corpus.
- **[`kz-uicheck`](skills/kz-uicheck/SKILL.md)**: Before calling UI work done: twelve paste-in browser checks that measure instead of judge, pointed at the screen the work is on.
- **[`kz-engrules`](skills/kz-engrules/SKILL.md)**: Any code task at all: the engineering floor everything else sits on, including how branches, commits and merges are done (rules 33-33c).
- **[`kz-fastfix`](skills/kz-fastfix/SKILL.md)**: A one-line edit (a typo, a label, a colour, a column, a one-line bug): a size test, then the change made directly, with at most the one check named for it. No crew, no loop.
- **[`kz-flashrule`](skills/kz-flashrule/SKILL.md)**: Everyday building of a component, a form or a screen, and a fast rule check of finished work: the core, the twenty-odd rules agents break most, on one page, each with its ID and the one check that catches it. Everything else is one pack per type of work, found through [`packs/LOOKUP.md`](skills/kz-uiuxrule/packs/LOOKUP.md).
- **[`kz-askcard`](skills/kz-askcard/SKILL.md)**: About to ask the user something: once on the first kz call in a session (the type of work and the size), and after that only when the request is genuinely ambiguous. Three to five decisions, one recommended, a custom option.
- **[`kz-crew021`](skills/kz-crew021/SKILL.md)**: A whole project, idea to maintenance, with a costed multi-agent crew.
- **[`kz-judge`](skills/kz-judge/SKILL.md)**: After the checks: the wording rules a script cannot measure (errors, button labels, empty states, delete confirmations), judged by a local Laya, only on questions it has passed on labelled examples. Costs the agent no tokens.
- **[`kz-reflect`](skills/kz-reflect/SKILL.md)**: A mistake was noticed and the fix verified: log it, classify it, and propose the rule or check change for a person to approve.
- **[`kz-loopfix`](skills/kz-loopfix/SKILL.md)**: One defect that "fix it and move on" already failed once: critic, fixer, then a gate.

Plus [`ui-glance`](skills/kz-uiuxrule/skills/ui-glance/SKILL.md), a child of `kz-uiuxrule`: a screenshot reviewed in one pass against a 22-point checklist.

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="docs/assets/banners/loads-dark.png"><img src="docs/assets/banners/loads-light.png" alt="94 rules to 1 pack" width="640"></picture></p>

## What loads when

At startup the agent sees only each skill's name and one-line description; files load only when a request matches, so the cost of having all thirteen installed is a few lines of context.
Every request is sized first (the speed contract in [`kz-skill`](skills/kz-skill/SKILL.md), engineering rule 29e).
The first kz call in a session asks one card with two lines: the type of work, from the rows of [`packs/LOOKUP.md`](skills/kz-uiuxrule/packs/LOOKUP.md) with the one your words match marked recommended, and the size (trivial, component or project).
Later calls reuse the answer.
A one-line edit goes to `kz-fastfix`, a component reads LOOKUP and the one pack its row names and runs only that pack's checks, and only reviews, audits, "make it production" and releases take the full path in `kz-uiuxrule`.

| You ask for... | Agent loads |
|---|---|
| "Fix this typo" or "Rename this button" | `kz-fastfix` SKILL.md and at most the one `kz-flashrule` line that applies; at most one check (`contrast-check.js` in both themes if a colour changed) |
| "Build an orders table with filters" | `packs/LOOKUP.md`, then the `table` pack (T1-T4, the table appendix and `snippets/filter-table.html`), then `table-check.js` and `popover-check.js`, and `layout-audit.js` once at 375px |
| "Add a site filter to this chart" | `packs/LOOKUP.md`, then the `chart` pack (the `T1` line in `kz-flashrule` covers chart and dashboard filters too), then `table-check.js` (`CHARTBOX`) and `layout-audit.js` once at 375px |
| "Add a dark mode" | `packs/LOOKUP.md`, then the `theme` pack, then `contrast-check.js` in both themes and `layout-audit.js` at 375px for the new control |
| "Make this page work on a phone" | `packs/LOOKUP.md`, then the `layout` pack, then `layout-audit.js` at 375px (and `typing-check.js` if the page has fields) |
| "Add an undo toast after delete" | `packs/LOOKUP.md`, then the `feedback` pack (A1-A4, S2 and `snippets/toast-stack.html`), then `toast-check.js` on the screen the toast appears on |
| "Explain these icon buttons" | `packs/LOOKUP.md`, then the `explain` pack (B1-B4, M6 and `snippets/tooltip.html`), then `explain-check.js` |
| "The filter dropdown won't close on mobile" | `kz-fastfix` SKILL.md and the `N2` line of `kz-flashrule`, then `popover-check.js` once |
| "Add a hover animation to the cards" | `kz-motionrule` SKILL.md, `motion-rules.md`, then `motion-check.js` |
| "Draw our checkout flow" | `kz-diagramrule` SKILL.md, `diagram-rules.md`, then `diagram-check.js` at a wide width and at 375px |
| "Review this signup form" | `kz-uiuxrule` SKILL.md (review mode), then the `form` pack (F1-F9 and the form appendix), then `form-check.js` and `typing-check.js` |
| "Is this chart right?" | `kz-uiuxrule` SKILL.md (review mode), then the `chart` pack (the core C rules in full, the rest one line each), `chart-rules.md` only for the appendix of that chart, then `table-check.js` and `layout-audit.js` |
| "Audit the whole UI" or "Make it production" | `kz-uiuxrule` SKILL.md and `references/modes.md`, then the rule ledger: every rule as one yes/no question (`rules/questions.md`, written to `.kz/ledger.md` by `scripts/ledger.py`), the full text only of the rules that apply, then all twelve checks at both widths and in both themes; done when `ledger.py status` prints `complete` |
| "What's wrong with this screenshot?" | `ui-glance` SKILL.md only: one read, no rule files |
| "Is this ready to ship?" | `kz-flashrule` SKILL.md, then the checks its lines name |
| "Check the error messages" | `kz-judge` SKILL.md and `scripts/judge.py` |
| "Run the whole project" | `kz-crew021` SKILL.md, then each file in `references/` as its phase starts |
| "The agent got it wrong, learn from it" | `kz-reflect` SKILL.md and `scripts/reflect.py` |

Any code task also reads the short always-on part of `kz-engrules` (L0 and the standing rules).
After the first-call card, the agent asks a question only when the request is genuinely ambiguous; otherwise it says in one line what it read the work to be and proceeds.

## The rules most often missed

| ID | Rule | The&nbsp;check&nbsp;that&nbsp;fails&nbsp;it |
|---|---|---|
| `S1` | Every table ships search, sort on every column and a filter per column. A "filter" is a panel, never a bare text box. | `table-check.js` |
| `T1` | A filter on a dimension is a panel, wherever it sits (a table column, a chart toolbar, a dashboard header): sort, a value list with counts, a range for numbers. Up to six values, outside a table's header row, visible chips with a count and a clear may stand in. | `table-check.js` (`BOX`, `CHARTBOX`) |
| `F8` | Typing is never interrupted. | `typing-check.js` |
| `F5` | A digit-only field selects its value when it is entered. | `rules-check.js` |
| `F6` | A field that holds an amount accepts the arithmetic that produces it. | `rules-check.js` |
| `C5` | A highlight follows the mark's own outline, never a box round it. | `layout-audit.js` |
| `B4` | Everything that acts answers the pointer, and answers the same way. | `rules-check.js` |
| `Y2` | Text over a variable background needs a contrast decision. | measured |
| `N5` | The mark showing where you are belongs to the thing it marks. | `rules-check.js` |
| `V3` | Verify the layout, not only the behaviour. | `layout-audit.js` |
| `G6` | A label sits beside its line, on an opaque plate, clear of the line and of every box. | `diagram-check.js` |

`rules-check.js` runs against the [reference page](docs/reference/README.md): it proves each right sample passes and each wrong sample still fails.
The twelve checks in `kz-uicheck` run on any page.

All 94 rules, one line each: [`docs/rule-index.md`](docs/rule-index.md).

## It's working if...

- **A table request produces a filter panel, not a text box.** Each column header has a button that opens sort, a value list with counts and, for numbers, a range. A chart or dashboard filter is the same panel, or, for up to six values, visible chips with a count and a clear.
- **A one-line change takes about as long as without the skills.** The agent makes the edit, runs at most the one check that covers it, and reports in a line.
- **The agent quotes rule IDs.** It says "`F8`: the field keeps focus while the list re-renders", not "I improved the UX".
- **The agent runs the checks for what it changed and pastes the output.** A table runs `table-check.js`, a form `form-check.js`, a theme `contrast-check.js` in both themes, a toast `toast-check.js`, an icon button `explain-check.js`, then `layout-audit.js` once at 375px; all twelve checks at both widths are for an audit, "make it production" or a release.
- **A check that could not reach the work counts as failed.** The agent points each run at the screen it changed (`--hash`, `--tap`, `--wait`), and a run that prints `WRONG SCREEN` is reported as a failure, never as clean.
- **A diagram passes `diagram-check.js`.** The console prints `clean (1 diagram(s) measured)`, not a list of `DIAGONAL` or `LABEL ON LINE` findings.
- **It asks one card on the first kz call, then only when the request is genuinely ambiguous.** The first card has two lines, the type of work and the size, each with one option marked recommended; later calls reuse the answer. Otherwise it says in one line what it read the work to be and proceeds; when it does ask, it is one card, three to five options, one marked recommended, and a custom answer always open.
- **A correction becomes a proposed rule or check.** When you tell it it got something wrong, `kz-reflect` logs the mistake and suggests the change for you to approve.

## When not to use it

- **Picking a visual style or a brand, or judging hover, press and focus from a screenshot.** Those are the two downsides under [How it compares](#how-it-compares): use your design system or a style skill for the look, and the live page with the checks for the states.
- **A diagram that lives in Git and changes every sprint.** Mermaid fits that better: it is text, it diffs in a pull request, and GitHub renders it. The diagram rules are for a diagram drawn as SVG on a page.
- **Non-UI work beyond the engineering floor.** For back-end, data or infrastructure work only `kz-engrules` applies; the rest of the set has nothing to add.

## FAQ

**Does it force a visual style?**
No. The rules say what must happen, not what it looks like. Where a project has its own design system, the project's rules win.

**My agent still built a text-box filter. Why?**
The agent never read `T1`. The line every agent sees is the summary, so the summary now defines the word "filter". If you keep your own always-on instructions, put the same definition there.

**Does it mix with impeccable or another style skill?**
Yes, and **the rules win where the two conflict** (see [How it compares](#how-it-compares)). [`docs/with-impeccable.md`](docs/with-impeccable.md) lists where they agree and the three places they can pull against each other.

**Does it draw diagrams in a house style, like diagram-design?**
No. [diagram-design](https://github.com/cathrynlavery/diagram-design) gives an agent a look for diagrams; `kz-diagramrule` gives it the rules any diagram must keep, whatever it looks like, and a check that measures them. They work together.

**Can I use only the rules, not the crew?**
Yes: install `kz-uiuxrule`, `kz-engrules`, `kz-askcard` and `kz-uicheck` together (see **Only part of it** under [Install](#install)).

**Do the checks need a framework or a build step?**
No. Paste a file into the browser console.

**Does it work with GPT?**
The skills are Markdown and the hook script is host-neutral, but the hook has only been tested on Claude Code.

## Important notes

- **The purpose hook is optional, and not in the plugin yet.** Nothing depends on it: the skills carry the same card and size test in their own text. On the first kz call in a session it prints the first-call card (the type of work from `packs/LOOKUP.md`, the matching one recommended, and the size), sizes `kz-uiuxrule` work before any rule is read, and asks `kz-crew021` what the run is for. Wire it by hand from [`skills/kz-askcard/hooks/README.md`](skills/kz-askcard/hooks/README.md).
- **Sample data uses Malaysian ringgit (`RM`).** It is sample data only.

---

## Repository map

<details>
<summary>Where everything lives</summary>

```text
skills/                          the thirteen skills, each a direct child of skills/
  kz-skill/                      the router: which skill fits the request
  kz-uiuxrule/                   the UI rules, in four modes (adopt, review, build, loop)
    packs/LOOKUP.md              task words to one pack and its checks: the first read
    packs/                       ten generated packs, one per type of work (generated)
    rules/INDEX.md               task words to the rule sections, when no pack covers the work
    rules/ui-rules.md            57 UI rules and their appendices, Appendix Z lessons
    rules/motion-rules.md        M1-M6, the one copy of the motion rules
    rules/chart-rules.md         C1-C21, choosing and wiring charts
    rules/diagram-rules.md       G1-G10, boxes, lines, labels and the budget
    rules/design-principles.md   the 16 principles behind the rules
    snippets/filter-table.html   a dependency-free table that passes every check
    snippets/toast-stack.html    one toast region: a capped stack, a count, a manual dismiss
    snippets/saved-note.html     a quiet Saved note beside an autosaved field
    snippets/tooltip.html        icon buttons that explain themselves on every device
    skills/ui-glance/            a screenshot reviewed in one pass
  kz-motionrule/                 lane: motion-rules.md and motion-check.js only
  kz-diagramrule/                lane: diagram-rules.md and diagram-check.js only
  kz-uicheck/                    the browser checks
    checks/layout-audit.js       overflow, clipping, focus boxes, undefined tokens
    checks/table-check.js        filter panels, sort, the header block
    checks/typing-check.js       focus and caret survive every keystroke
    checks/popover-check.js      every panel closes every way
    checks/modal-check.js        a modal locks the page behind and can be left
    checks/focus-check.js        every control shows where focus is
    checks/form-check.js         every field has a label; required is marked
    checks/contrast-check.js     text contrast, in both themes
    checks/motion-check.js       transition all, ease-in, scale(0), no press state
    checks/diagram-check.js      diagonal lines, labels on lines, lines behind boxes
    checks/toast-check.js        one toast region, a capped stack, repeats counted not restacked
    checks/explain-check.js      every icon button explains itself on hover, focus and touch
    scripts/run-checks.py        the named checks on a local file in headless Chrome, on the right screen
  kz-engrules/                   engineering rules for any code, including git
  kz-fastfix/                    the fast lane for one small job
  kz-flashrule/                  the core rules on one page; LOOKUP routes the rest
  kz-askcard/                    one card for asking the user, and the purpose hook
  kz-crew021/                    a whole project with a costed crew
  kz-judge/                      wording rules judged by a small model
  kz-reflect/                    turns a verified mistake into a proposed rule change
  kz-loopfix/                    critic, fixer and gate for one stubborn defect
docs/
  reference/                     the live wrong/right page and the checks bound to it
  rule-index.md                  every rule, one line each (generated)
  install.md                     install per host, and fixes for "it does not show up"
  with-impeccable.md             using the rules beside a style skill
  benchmark.md                   what the skills cost in time and tokens, and what they buy
  assets/                        the hero GIF, the carousels and the gallery pictures
scripts/
  validate.py                    frontmatter, links, line endings, index and pack freshness
  build-index.py                 regenerates docs/rule-index.md and the packs from the rule files
  build-packs.py                 writes packs/LOOKUP.md and the ten packs (called by build-index.py)
  check-branch.py                fails a branch name that is not feat/fix/docs/chore kebab-case
  make-carousel.py               rebuilds the carousel GIFs from the reference page
  hero/                          the Remotion project that renders docs/assets/hero.gif
  bench/                         the benchmark harness: tasks, runs, scoring, a blind judge, results
AGENTS.md                        how any agent uses and works in this repository
llms.txt                         the index for LLM crawlers
```

</details>

## Contributing

Contributions are welcome: a mistake an agent made, a new rule, a sharper check, a wrong/right sample, or a docs fix.
The most useful one is a real mistake, because every rule here started as one.

**Add a rule in five steps**

1. Open an issue with the real mistake and what broke because of it.
2. Write the rule in the right file under `skills/kz-uiuxrule/rules/`, with the failure it prevents and the check that catches it, using the next free ID in its category.
3. Make the check fail on a wrong sample and pass on a right one. Put the wrong/right pair on the reference page, and have `rules-check.js` assert that the wrong half still fails.
4. Run `python scripts/build-index.py`, `python scripts/validate.py` and `python scripts/check-branch.py`, and `python scripts/make-carousel.py` if a carousel sample changed.
5. Open a pull request from a branch named for the work, such as `feat/table-export-rule`.

**Ground rules, and why**

- **Rule IDs never change.** Other people's agents cite them, so a renumbered rule silently points their citations at the wrong thing. Retire a rule in place instead.
- **A check that has never failed is decoration.** Until you have seen it fail on the wrong sample, you do not know it measures anything.
- **Branch names say the work, not the tool.** A name like `fix/popover-close` tells a reviewer what changed; a tool or session name tells them nothing.
- **ASCII and LF only.** Curly quotes, em dashes and CRLF line endings break diffs, greps and some agents' edits.

The full working rules are in [`AGENTS.md`](AGENTS.md).

## Star history

<a href="https://www.star-history.com/#kz-95/kz-skills&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=kz-95/kz-skills&type=Date&theme=dark">
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=kz-95/kz-skills&type=Date">
    <img alt="Star history chart for kz-95/kz-skills" src="https://api.star-history.com/svg?repos=kz-95/kz-skills&type=Date">
  </picture>
</a>

## License

Apache-2.0 with the [Commons Clause](https://commonsclause.com/). See [`LICENSE`](LICENSE).

**You may** use it, change it, and use it in commercial work: build your own products with these rules, use them inside your company, and share your changes.

**You may not** sell it: you cannot charge third parties for the software itself, or for hosting, consulting or support whose value comes substantially from it. The Commons Clause defines "Sell" in the `LICENSE` file; if your case is not obvious, ask first.

This makes it *source-available*, not open source in the OSI sense, so GitHub will not show an "Apache-2.0" badge.

## Credits

Diagram rules G3-G6 and the diagram complexity budget are adapted from [diagram-design](https://github.com/cathrynlavery/diagram-design) by Cathryn Lavery (MIT).
