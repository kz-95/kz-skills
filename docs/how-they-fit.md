# How the skills fit together

Thirteen skills and one child. Each can be called on its own. `kz-skill` is the entry point for when a request spans several, or when it is not obvious which applies.

```
kz-engrules      the floor: applies to every task, UI or not
  kz-fastfix     the lane for one small job; escalates when it grows
  kz-flashrule   the most critical rules, one page, the first read for small UI work
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

- **Trivial**, one element or one line with no new behaviour: `kz-fastfix`, at most the one `kz-flashrule` line that applies, at most the one check that covers it, a one-line report.
- **Small or medium**, a component or a screen: `kz-flashrule` first, a full rule section only when one of its lines points there, then only the checks named for that kind of work, once, and `layout-audit` once at 375px.
- **Large**, a project, an audit, "make it production" or a release: the full path, with all ten checks at both widths and in both themes (`kz-uiuxrule` mode 4, `kz-crew021`, `kz-loopfix`).

Follow-ups stay light, nothing is written into the user's project unasked, and the agent asks only when the request is genuinely ambiguous.
What each lane costs and buys, measured on two models, is in [`benchmark.md`](benchmark.md).

## Which one, for which request

| The request | Use | Why |
|---|---|---|
| Any code task at all | `kz-engrules` first | It is short and nothing scopes it out |
| A typo, a label, a colour, a column, a doc line, a one-line bug | `kz-fastfix` | A size test, then the change made directly, with at most the one check named for it; no crew, no loop |
| Build or change a component, a table, a form, a chart filter, a screen | `kz-flashrule` first | The rules that break worst when missed, one read, each with its fastest check; only the checks named for the change run |
| "Quick check before I call this done" | `kz-flashrule` | The same page, read as a checklist of finished work |
| Review or audit a screen, "make it production", a release | `kz-uiuxrule` | The rules, in four modes, and the full check suite where the work is large |
| "Look at this screenshot and tell me what is wrong" | `ui-glance` (child of `kz-uiuxrule`) | One read, one pass, three to six findings |
| An animation, a transition, a press effect, nothing else | `kz-motionrule` | The six motion rules and their check, without the rest of the corpus |
| An architecture diagram, a flowchart, a sequence, a state machine, nothing else | `kz-diagramrule` | The ten diagram rules and their check, without the rest of the corpus |
| "Is this UI done?" | `kz-uicheck` | Ten checks that measure layout, tables, typing, forms, motion and diagrams instead of judging them |
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
| **3. Build** | "Make this page", "add a table" | The work, built under the rules (reading `kz-flashrule` first), checked by the checks for what it touched; a check is left in the project only when asked or in mode 4 |
| **4. Loop** | "Make it right", production | Three reviewers against a separate fixer, until they agree with evidence |

The reviewer and the fixer are never the same agent. Nobody approves their own work.

## Finding a rule

- **By the words of your task:** [`INDEX.md`](../skills/kz-uiuxrule/rules/INDEX.md). `table`, `form`, `chart`, `dark mode`, `back button` each name the two or three sections that apply.
- **By its statement:** [`rule-index.md`](rule-index.md), every rule on one line.
- **By seeing it:** the [live reference page](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html), a wrong and a right sample for each rule.

Rule IDs are a category letter and a position: `T2` is the second rule about tables. They are stable, and never renumbered.
