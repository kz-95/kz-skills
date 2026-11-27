# How the skills fit together

Thirteen skills and one child. Each can be called on its own. `kz-skill` is the entry point for when a request spans several, or when it is not obvious which applies.

```
kz-engrules      the floor: applies to every task, UI or not
  kz-fastfix     the lane for one small job; escalates when it grows
  kz-flashrule   the core twenty rules, one page; packs/LOOKUP.md routes the rest
  kz-uiuxrule    adds the interface rules on top of it
    kz-motionrule  its motion rules alone, for work that only moves
    kz-diagramrule its diagram rules alone, for work that is only a diagram
    kz-uicheck   the instruments its verification rules tell you to run
kz-askcard       how any of them asks the user something
kz-judge         the wording judgements a script cannot make
kz-reflect       the learning loop: a verified mistake becomes a better rule or check
kz-crew021       the workflow that dispatches the rest across a crew (the large path)
  kz-loopfix     what it escalates a repeat defect into
```

## Size the change first

Every skill that builds or checks UI follows the speed contract in [`kz-skill`](../skills/kz-skill/SKILL.md) (engineering rule 29e: verification is proportional to the change).
The first kz call in a session asks one card with two lines: the type of work, from the rows of [`packs/LOOKUP.md`](../skills/kz-uiuxrule/packs/LOOKUP.md) with the one the request's words match marked recommended, and the size.
Later calls reuse the answer.

- **Trivial**, one element or one line with no new behaviour: `kz-fastfix`, at most the one `kz-flashrule` line that applies, at most the one check that covers it, a one-line report.
- **Small or medium**, a component or a screen: `packs/LOOKUP.md`, then the one pack its row names (the rules in full, the appendix it needs, a snippet and the exact check command), then only that pack's checks, once, on the screen the work is on, and `layout-audit` once at 375px. A run that prints `WRONG SCREEN` is a failure. The rule files open only when no pack covers the work.
- **Large**, a project, an audit, "make it production" or a release: the full path, with all fourteen checks at both widths and in both themes (`kz-uiuxrule` mode 4, `kz-crew021`, `kz-loopfix`).

Follow-ups stay light, nothing is written into the user's project unasked, and after the first-call card the agent asks only when the request is genuinely ambiguous.
What each lane costs and buys, measured on two models, is in [`benchmark.md`](benchmark.md).

## Which one, for which request

| The request | Use | Why |
|---|---|---|
| Any code task at all | `kz-engrules` first | It is short and nothing scopes it out |
| A typo, a label, a colour, a column, a doc line, a one-line bug | `kz-fastfix` | A size test, then the change made directly, with at most the one check named for it; no crew, no loop |
| Build or change a component, a table, a form, a chart filter, a toast, a screen | `packs/LOOKUP.md`, then one pack | The lookup names the one pack for the type of work: its rules, a snippet and its checks; only that pack's checks run. `kz-flashrule` holds the core lines agents break most |
| "Quick check before I call this done" | `kz-flashrule` | The same page, read as a checklist of finished work |
| Review or audit a screen, "make it production", a release | `kz-uiuxrule` | The rules, in four modes, and the full check suite where the work is large |
| "Look at this screenshot and tell me what is wrong" | `ui-glance` (child of `kz-uiuxrule`) | One read, one pass, three to six findings |
| An animation, a transition, a press effect, nothing else | `kz-motionrule` | The six motion rules and their check, without the rest of the corpus |
| An architecture diagram, a flowchart, a sequence, a state machine, nothing else | `kz-diagramrule` | The ten diagram rules and their check, without the rest of the corpus |
| "Is this UI done?" | `kz-uicheck` | Twelve checks that measure layout, tables, typing, forms, motion, diagrams, toasts and explainers instead of judging them, on the screen the work is on |
| A whole project, idea to maintenance | `kz-crew021` | Phases, scope relay, a proof of concept before any fan-out, a budget |
| A mistake noticed and fixed, which should not recur | `kz-reflect` | Records it, classifies it into one of seven outcomes, proposes the change; a person approves |
| One defect, already fixed once, still broken | `kz-loopfix` | Critic and fixer to agreement, then a gate rules on whether the agreement is true |
| About to ask the user something | `kz-askcard` | Three to five decisions, one recommended, a custom option, a default per line |

Two at once is normal: a crew run that ships UI uses most of them. Opening the router first is not required. If the request names its own lane, go straight to that skill.

## The four modes of `kz-uiuxrule`

| Mode | When | What you get |
|---|---|---|
| **1. Adopt** | A project with no UI rules, or with its own | The rules put in, consolidating what exists; the project's own rules win |
| **2. Review** | "Check this against the rules" | Findings by rule ID, each with the measurement that proves it |
| **3. Build** | "Make this page", "add a table" | The work, built under the rules (reading `packs/LOOKUP.md` and the one pack it names), checked by that pack's checks; a check is left in the project only when asked or in mode 4 |
| **4. Loop** | "Make it right", production | Three reviewers against a separate fixer, until they agree with evidence |

The reviewer and the fixer are never the same agent. Nobody approves their own work.

## Finding a rule

- **By the words of your task:** [`packs/LOOKUP.md`](../skills/kz-uiuxrule/packs/LOOKUP.md). `toast`, `tooltip`, `table`, `form`, `dark mode` each name one pack and its checks. When no pack covers the work, [`INDEX.md`](../skills/kz-uiuxrule/rules/INDEX.md) names the two or three rule sections that apply.
- **By its statement:** [`rule-index.md`](rule-index.md), every rule on one line.
- **By seeing it:** the [live reference page](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html), a wrong and a right sample for each rule.

Rule IDs are a category letter and a position: `T2` is the second rule about tables. They are stable, and never renumbered.
