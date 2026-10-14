# kz-uiuxrule - mode detail

Read the section for the mode you are in, when you are in it. `../SKILL.md` has the size test,
the mode table, mode 3 and the rules always in force; this file has the rest.

## Mode 1 - Adopt: put the rules in the project

**Goal:** the project ends up with one design-rule document it owns, and an index that says
what is in it and when to reach for it.

1. **Look first.** Search for existing rules: `docs/`, `AGENTS.md`, `CLAUDE.md`,
   `CONTRIBUTING.md`, `.cursorrules`, a design-system README, Storybook docs, a design tokens
   file. Read what you find before writing anything.
2. **Then one of three:**
   - **Nothing exists** - write `docs/design-rules.md` from the categories that apply to this
     project (a project with no charts does not carry `C1-C21`), plus `docs/README.md` as the
     index: one row per document, what it covers, and *when to reach for it*.
   - **Something exists** - **consolidate, never overwrite.** The project's own rules win on
     every conflict (the precedence ladder). Produce a merged document that keeps their
     wording, adds only what is missing, and lists in a "Changed" section every place the two
     disagreed and which way it was resolved.
   - **Both exist and disagree materially** - Ask Card: their rule, this rule, or both with a
     scope on each.
3. **Never silently restate.** If a rule here is already covered by the project in different
   words, cite theirs and move on. Two documents saying the same thing in different words is
   how a corpus starts lying.
4. **Index every document in the same change.** A stale index is worse than none, because it
   is believed.

## Mode 2 - Review: findings, not opinions

The corpus covers fourteen categories; almost nobody wants all of them. Unless the request
names the sections, offer them by letter on one card (`../../kz-askcard/`, inline format: no
ledger, the answers apply to this run only):

```
ASK CARD - review
Found:    a React dashboard: 4 tables, 2 charts, a modal, dark mode
Proposed: T (tables), C (charts), N (overlays), Y (type/colour/theming)
Decide:
  1. Which sections?  [ T C N Y (recommended - what this screen has) | all 13 | pick your own | custom ]
  2. Depth?           [ fast: the criticals (recommended - four tables, one pass) | full: every rule | custom ]
  3. Report as?       [ findings list (recommended - you choose what to fix) | list plus fixes | fixes applied ]
Assumed if you do not answer: the recommended option on each line.
```

Then, for each chosen section:

- Cite by **rule id** (`T2`, `Y2`, `N5`) - never "it looks cramped".
- Carry the **measurement** that proves it: the contrast ratio, the pixel gap, the count of
  columns without a filter, the element with no accessible name. A finding without a number
  is an opinion, and opinions are what this corpus exists to replace.
- Say what to do, in one line, and stop. The fix belongs to mode 3.
- **Documented departures are not findings.** Undocumented departures are.

## Mode 4 - Loop: when it has to be right

**The reviewer and the fixer are never the same agent, and nobody approves their own work.**

```
build/fix  ->  3 reviewers, independently, against named rule ids
           ->  unanimous pass?  -> done
           ->  any finding      -> a different agent fixes it
           ->  repeat, and a reviewer who was overruled says why
```

- **Three reviewers, not one.** Two of three catching the same thing is evidence; one reviewer
  agreeing with the builder is not.
- **The fixer is a different agent from every reviewer.** A fixer reviewing its own fix
  sanitises it, which is the failure this loop exists to prevent.
- **A debugger joins when a finding survives one fix.** A defect that comes back is a
  root-cause problem, not a patch problem.
- **Exit on the gate, never on a round count.** The loop ends when the reviewers are unanimous
  on the actual text or screen - not after three passes.
- **Where the host has a workflow for this, use it:** `kz-crew021` (dispatch, budget gate,
  per-task verification) or a gauntlet-style loop skill (`kz-loopfix`). This skill supplies
  the rules and the verdict criteria; the workflow supplies the agents and the budget.
- Mode 4 is where the full check suite runs (`run-checks.py` at 1280 and `--width 390`, both
  themes, output pasted into the report) and where a runnable check is left in the project.

**The speed dial** decides whether mode 4 runs at all: **Fast** is mode 2 at depth
"criticals", then fix what was found, one pass, no loop. **Right** is mode 3, then mode 4
until unanimous. If the user says fast, do not quietly run the loop because the work looks
risky - say in one line what the fast pass skips, and proceed as asked.

Without a multi-agent host: run mode 2 three times with a cleared context between passes and
treat agreement across passes as the gate - weaker, but the same shape.

## Style skills rank below these rules

A style or design skill - impeccable, or any like it - decides what the rules leave open
(palette, type, shape language, density, the personality of motion) and nothing they state.
Where its guidance conflicts with a rule here, the rule wins: its line that "a zero-offset
coloured halo is decoration" is about depth at rest, and `B4`'s hover halo stands. What a
style skill generates (tokens, a design file) is a style decision, not a behaviour one: it
cannot remove a rule that has a check.

## Before calling large UI work done (the close-out list)

1. Every applicable state shipped: loading, empty, error, partial, overflow, no-permission.
2. Layout verified at more than one width, including the narrowest supported, with touch
   emulation - geometry, not only behaviour.
3. Long content tried: a sixty-character name in the longest row, a translated label, zero
   rows, far too many rows.
4. Contrast measured rather than assumed, in both themes.
5. Keyboard path walked: tab order, visible focus, escape from every overlay.
6. After changing one control, every other number on screen re-read.

The full checklist is in `../rules/design-principles.md`.

## The rule files

| File | Holds |
|---|---|
| `../skills/ui-glance/SKILL.md` | The child skill: a screenshot reviewed in one pass, twenty-two checks, no rule-set read |
| `../rules/INDEX.md` | Route by keyword: which rules apply to which job |
| `../rules/ui-rules.md` | The 57 UI rules by category and the appendices. Appendix Z is twenty-six mistakes to have read before a large build |
| `../rules/chart-rules.md` | `C1-C21`: anything that renders data as marks, and the table bound to it |
| `../rules/motion-rules.md` | `M1-M6`, with durations, curves and mechanics. Also read alone by `../../kz-motionrule/` |
| `../rules/diagram-rules.md` | `G1-G10`, with the budget and the line and label numbers. Also read alone by `../../kz-diagramrule/` |
| `../../kz-engrules/rules/engineering-rules.md` | Non-UI rules for code work, where `S1` and `S2` are defined |
| `../rules/design-principles.md` | The sixteen principles behind the rules, and the close-out checklist |

Rules are cited by a category letter and a position - `T2` is the second rule about tables,
`V3` the third about verification:

| Letter | Category | Letter | Category |
|---|---|---|---|
| D | Fitting the design system | Y | Type, colour and theming |
| L | Layout, spacing and hierarchy | M / G | Motion / diagrams |
| B | Buttons and their explainers | P | Performance and content |
| T | Tables and columns | X | Accessibility and language |
| F | Forms and input | K | Copy |
| A | Actions and feedback | V | Verification |
| N | Overlays and navigation | C / S | Charts / standing rules |

## For agents that are not Claude

Nothing here depends on a Claude feature. The rule files are plain Markdown: point a
file-reading agent at the folder, or paste `../rules/INDEX.md` and let the model ask for the
sections it needs.
