# How the skills fit together

Eight skills and one child. Each can be called on its own. `kz-skill` is the entry point for when a request spans several, or when it is not obvious which applies.

```
kz-engrules      the floor: applies to every task, UI or not
  kz-uiuxrule    adds the interface rules on top of it
    kz-uicheck   the instruments its verification rules tell you to run
kz-askcard       how any of them asks the user something
kz-reflect       the learning loop: a verified mistake becomes a better rule or check
kz-crew021       the workflow that dispatches the rest across a crew
  kz-loopfix     what it escalates a repeat defect into
```

## Which one, for which request

| The request | Use | Why |
|---|---|---|
| Any code task at all | `kz-engrules` first | It is short and nothing scopes it out |
| Build, change or review a screen, table, form, chart, overlay | `kz-uiuxrule` | The rules, in four modes |
| "Look at this screenshot and tell me what is wrong" | `ui-glance` (child of `kz-uiuxrule`) | One read, one pass, three to six findings |
| "Is this UI done?" | `kz-uicheck` | Measures layout, tables and typing instead of judging them |
| A whole project, idea to maintenance | `kz-crew021` | Phases, scope relay, a proof of concept before any fan-out, a budget |
| A mistake noticed and fixed, which should not recur | `kz-reflect` | Records it, classifies it into one of seven outcomes, proposes the change; a person approves |
| One defect, already fixed once, still broken | `kz-loopfix` | Critic and fixer to agreement, then a gate rules on whether the agreement is true |
| About to ask the user something | `kz-askcard` | Three to five decisions, one recommended, a custom option, a default per line |

Two at once is normal: a crew run that ships UI uses all eight. Opening the router first is not required. If the request names its own lane, go straight to that skill.

## The four modes of `kz-uiuxrule`

| Mode | When | What you get |
|---|---|---|
| **1. Adopt** | A project with no UI rules, or with its own | The rules put in, consolidating what exists; the project's own rules win |
| **2. Review** | "Check this against the rules" | Findings by rule ID, each with the measurement that proves it |
| **3. Build** | "Make this page", "add a table" | The work, built under the rules, with a runnable check left behind |
| **4. Loop** | "Make it right", production | Three reviewers against a separate fixer, until they agree with evidence |

The reviewer and the fixer are never the same agent. Nobody approves their own work.

## Finding a rule

- **By the words of your task:** [`INDEX.md`](../skills/kz-uiuxrule/rules/INDEX.md). `table`, `form`, `chart`, `dark mode`, `back button` each name the two or three sections that apply.
- **By its statement:** [`rule-index.md`](rule-index.md), every rule on one line.
- **By seeing it:** the [live reference page](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html), a wrong and a right sample for each rule.

Rule IDs are a category letter and a position: `T2` is the second rule about tables. They are stable, and never renumbered.
