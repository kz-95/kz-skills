---
name: kz-skill
description: "Router for the kz skillset, and home of its speed contract (size the change first, read and check only what it touches) - the fast lane for a single small job (kz-fastfix), a one-page check of the most critical rules (kz-flashrule), running a whole project with a costed multi-agent crew (kz-crew021), engineering rules for any code work (kz-engrules), building and reviewing interfaces against a stack-neutral rule corpus (kz-uiuxrule), the motion rules alone (kz-motionrule), the diagram rules alone (kz-diagramrule), runnable browser checks that measure rather than judge (kz-uicheck), the one-card rule for asking a user anything (kz-askcard), and repairing one stubborn defect in a critic/fixer/gate loop (kz-loopfix). Use when a request spans more than one of those, or when it is unclear which applies. Triggers on \"/kz-skill\", \"kz skill\", \"kz skillset\"."
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-skill

Thirteen skills, one entry point. This file picks; the named skill does the work. Read only
the one you need. Each can be called directly (`/kz-uiuxrule`, `/kz-crew021`, ...); come here
when a request spans more than one or its lane is not obvious. A skill nested inside another
is not a command: its parent reads it.

| Skill | Reach for it when |
|---|---|
| `../kz-engrules/` | Any code task at all - L0 behaviour, L1 code work, the S standing rules, ASCII discipline and its hook. The floor everything else sits on |
| `../kz-fastfix/` | One small job: a typo, a label, a style tweak, a column, a doc line, a one-line bug. Size test first; if it passes, changed directly and checked once, no crew, no loop |
| `../kz-flashrule/` | The rules that break worst when missed, each with its ID and fastest check, on one page. The default first read for small and medium UI work |
| `../kz-askcard/` | About to ask the user something. Three to five decisions, one recommended, a custom option, a default per line, one card per turn |
| `../kz-crew021/` | A whole project, idea to maintenance: phases, scope relay, PoC spike, contract-first parallel build, dispatch gates, budget, retro |
| `../kz-uiuxrule/` | Creating, changing, reviewing or standardising UI beyond one element - 57 UI rules, 6 motion, 21 chart, 10 diagram, 16 principles, four modes |
| `../kz-motionrule/` | Only motion: an animation, a transition, an easing curve, a press or hover effect, an entrance. The six M rules and the motion check |
| `../kz-diagramrule/` | Only a diagram: architecture, flowchart, sequence, state machine, data model, swimlane. The ten G rules and the diagram check |
| `../kz-uicheck/` | Measuring UI: ten paste-in console checks (layout, tables, typing, popovers, contrast, modals, focus, forms, motion, diagrams), on any page |
| `../kz-judge/` | After `kz-uicheck`: the wording rules a script cannot measure, judged by Jev or a local Laya at no cost to the agent's tokens. Skips cleanly when neither is present |
| `../kz-reflect/` | Something went wrong, a person noticed, the fix is verified: log it, classify it, propose the rule or check change for a person to approve. Never edits a shared rule itself |
| `../kz-loopfix/` | One broken thing where "fix it and move on" already failed once: critic <-> fixer to agreement, then a gate rules on whether the agreement is true |

## The speed contract

Every kz skill that builds or checks UI follows this; the others point here. It is engineering
rule 29e (`../kz-engrules/rules/engineering-rules.md`) applied. Why: on six single-file HTML
tasks (`docs/benchmark.md`), `/kz-uiuxrule` ran 2.46x slower (1.35x-4.12x; Opus 2.8x-5.1x),
from the full check suite on every change and follow-up, a 25-45 KB read whatever the task
size, and work nobody asked for. Quality gains (check failures 75 -> 26) came from the scoped
rules and checks, which this keeps.

1. **Size test first, before reading any rule.**
   - **Trivial** - one element or one line, no new behaviour (a label, a colour, a width, a
     column): read at most the one `kz-flashrule` line that applies, make the change, run at
     most the one check that covers it (or none), report in one line. That is `kz-fastfix`.
   - **Small/medium** - a component or a screen: read `../kz-flashrule/SKILL.md` first. Open
     the `rules/INDEX.md` row and the one or two sections it names only when a flashrule line
     says "see X" or no line covers the work. Build. Run only the checks named for its kind:
     table -> `table-check` (+ `popover-check` for its panels), form -> `form-check`
     (+ `typing-check` at 375px), popover/dropdown -> `popover-check`, modal -> `modal-check`,
     motion -> `motion-check`, diagram -> `diagram-check`, colour/theme -> `contrast-check`
     in both themes; then `layout-audit` once at 375px. Not every check a touched element
     could fail, and never `run-checks.py` without `--checks`.
   - **Large** - a project, an audit, "make it production", a release: the full path (all
     ten checks, both widths, both themes; `kz-uiuxrule` mode 4, `kz-crew021`, `kz-loopfix`).
2. **No question unless genuinely ambiguous.** State the assumptions in one line and proceed
   (engineering rule 3). The Ask Card is for adopt or review scope, and for real ambiguity.
3. **Checks are scoped and run once.** Fix what a check reports, then re-run only that check;
   never the full suite after a targeted fix. Both themes only when colour or theme changed.
   The full suite only for mode 4, "make it production", or before a release. "To be safe" is
   not a reason to run more; no harness or test script of your own to check a page, either.
4. **Follow-ups stay light.** Do not re-read rules already read in this session; check only
   what the follow-up touched.
5. **Nothing unasked.** A check left behind in the user's project is opt-in (mode 4, or the
   user asks); never write check scripts or test files into it unasked. No feature or UI that
   was not requested (engineering rule 28).
6. **Small work goes to `kz-fastfix`.** A one-element or one-line change does not open the
   rule corpus.

Speed never scales the floor down: the safety floor, `S1` (a table still ships the T1 filter
panel) and `S2` hold at every size.

## How they stack

```
kz-engrules      the floor: applies to every task, UI or not
  kz-fastfix     the lane for one small job; escalates when it grows
  kz-flashrule   the most critical rules, one page, the first read for small UI work
  kz-uiuxrule    adds the interface rules on top of it
    kz-motionrule  its motion rules alone, for work that only moves
    kz-diagramrule its diagram rules alone, for work that is only a diagram
    kz-uicheck   the instruments its V rules tell you to run
kz-judge         the wording judgements a script cannot make
kz-reflect       the learning loop: what went wrong becomes a better rule or check
kz-askcard       how any of them asks the user something
kz-crew021       the workflow that dispatches the rest across a crew (the large path)
  kz-loopfix     what it escalates a repeat defect into
```

## Routing

- **Any code work** -> `kz-engrules` first. It is short and nothing scopes it out.
- **One job that passes the size test** (no crew run under way) -> `kz-fastfix`, before
  anything below. A "no" on any line sends it on by its escalate routes.
- **A quick rule check of finished work** -> `kz-flashrule`. A failing line opens the full rule.
- **Project work** -> `kz-crew021`. It calls `kz-uiuxrule` for UI it ships and `kz-loopfix`
  for a defect that came back.
- **UI only, no project scaffolding** -> `kz-uiuxrule`. Its child
  `../kz-uiuxrule/skills/ui-glance/` is the one-read screenshot pass, read through its parent;
  `kz-uicheck` measures.
- **A mistake was noticed and fixed, and should not happen again** -> `kz-reflect`, after the
  fix is verified. A person approves any rule change.
- **One defect, already fixed once, still broken** -> `kz-loopfix`. The most expensive thing
  here; not for a first attempt.

Two at once is normal - a crew run that ships UI uses most of them. Opening the router first
is not: if the request names its own lane, go straight there. One card per turn holds across
the whole set (`kz-askcard`, rule 6).
