---
name: kz-skill
description: Router for the kz skillset - running a whole project with a costed multi-agent crew (kz-crew021), engineering rules for any code work (kz-engrules), building and reviewing interfaces against a stack-neutral rule corpus (kz-uiuxrule), runnable browser checks that measure rather than judge (kz-uicheck), the one-card rule for asking a user anything (kz-askcard), and repairing one stubborn defect in a critic/fixer/gate loop (kz-loopfix). Use when a request spans more than one of those, or when it is unclear which applies. Triggers on "/kz-skill", "kz skill", "kz skillset".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-skill

Eight skills, one entry point. This file picks; the named skill does the work. Read only
the one you need.

Each is installed beside this one and can be called directly - `/kz-uiuxrule`,
`/kz-crew021`, and so on. Come here when a request spans more than one, or when which
lane it belongs to is not obvious. A skill nested inside another is not a command: it is
read by its parent.

| Skill | Reach for it when |
|---|---|
| `../kz-engrules/` | Any code task at all - L0 behaviour, L1 code work, the S standing rules, ASCII discipline and its hook. The floor everything else sits on |
| `../kz-askcard/` | About to ask the user something. Three to five decisions, one recommended, a custom option, a default per line, one card per turn |
| `../kz-crew021/` | A whole project, idea to maintenance: phases, scope relay, PoC spike, contract-first parallel build, dispatch gates, budget, retro |
| `../kz-uiuxrule/` | Anything that creates, changes, reviews or standardises UI - 57 UI rules, 21 chart rules, 16 principles, four modes |
| `../kz-uicheck/` | Before calling UI work done: eight paste-in console checks (layout, tables, typing, popovers, contrast, modals, focus, forms), on any page |
| `../kz-reflect/` | Something went wrong, a person noticed, and the fix is verified: log it, classify it (strengthen a summary, clarify a rule, new rule, new check), and propose the change for a person to approve. Never edits a shared rule itself |
| `../kz-loopfix/` | One broken thing where "fix it and move on" already failed once: critic <-> fixer to agreement, then a gate rules on whether the agreement is true |

## How they stack

```
kz-engrules      the floor: applies to every task, UI or not
  kz-uiuxrule    adds the interface rules on top of it
    kz-uicheck   the instruments its V rules tell you to run
kz-reflect       the learning loop: what went wrong becomes a better rule or check
kz-askcard       how any of them asks the user something
kz-crew021       the workflow that dispatches the rest across a crew
  kz-loopfix     what it escalates a repeat defect into
```

## Routing

- **Any code work** -> `kz-engrules` first. It is short and nothing scopes it out.
- **Project work** -> `kz-crew021`. It calls `kz-uiuxrule` for UI it ships and
  `kz-loopfix` for a defect that came back.
- **UI only, no project scaffolding** -> `kz-uiuxrule` directly. Its own child,
  `../kz-uiuxrule/skills/ui-glance/`, is the one-read screenshot pass - read through its
  parent, not called; `kz-uicheck` is the close-out.
- **A mistake was noticed and fixed, and should not happen again** -> `kz-reflect`, only after the fix is verified. It records and proposes; a person approves any rule change.
- **One defect, already fixed once, still broken** -> `kz-loopfix`. It is the most
  expensive thing here; do not open it for a first attempt.

Two of these at once is normal - a crew run that ships UI uses all eight. Opening the
router first is not: if the request names its own lane, go straight to that skill.

One card per turn holds across the whole set. Where two children would each raise one,
they are the same instrument (`kz-askcard`, rule 6).
