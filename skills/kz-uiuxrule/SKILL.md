---
name: kz-uiuxrule
description: Stack-neutral, style-neutral UI rules for building, reviewing and governing any interface - tables, forms, charts, overlays, layout, theming, motion, performance, accessibility. 57 UI rules, 21 chart rules and 16 principles, each stating an obligation, the failure that follows when it is missed, and the check that catches it. Four modes - adopt the rules into a project, review against them, build under them, or run the full reviewer/fixer loop. Use when creating, changing, reviewing or standardising UI, or when a screen looks unprofessional and the reason is not obvious. Not for backend-only work.
version: 2.1.0
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# Universal UI/UX rules

A rule corpus and the four things to do with it. It says what any interface has to do and
what breaks when it does not. It never picks a palette, a typeface, a framework or a look:
those are the project's, and a rule that survives the choice is the only kind worth writing
down.

## Child skill

`skills/ui-glance/` - **a screenshot, one pass.** Twenty-two things to look for in a picture,
ordered by how often each is the actual problem, each citing a rule id. It reads one file
and asks nothing: a pasted screenshot has already said what it wants. Reach for it when
someone wants a fast look rather than a review; reach for mode 2 when the code is available
and a finding needs a measurement behind it.

Step zero below does not apply to it - the purpose is not in doubt when a picture arrives.

## Step zero: ask what this is for

**Before reading a rule, opening a file, or planning anything, ask the user which mode and
what scope.** One Ask Card, then work. This is not a courtesy - the corpus is ninety-four
rules across four modes, and the two ways it wastes a session are both guesses: adopting
rules over a project that already has its own, and reviewing all of them when the user
wanted two.

The only exception: the request already names the mode and the scope. Then say in one line
what you read from it and proceed. Never ask a question the user has already answered.

`../kz-askcard/hooks/ui-rule-purpose.mjs` enforces this outside the document, for any host that can run
a command before a skill call and feed its stdout back to the model - which most agent
runners can, not just Claude Code. It is host-neutral: stdin JSON, a JSON argument or a
bare skill name all work, it fires only for this skill, and it never blocks. Wiring, and
what has actually been tested, is in `../kz-askcard/hooks/README.md`. Where no hook is wired, this
section is the requirement.

## Pick the mode before doing anything else

| Mode | The request sounds like | What it produces |
|---|---|---|
| **0. Glance** | a pasted screenshot, "quick look", "what is wrong with this" | Three to six findings by rule id, from the picture alone - `skills/ui-glance/` |
| **1. Adopt** | "set up design rules", "we need standards", "add this to the project" | A design-rule document in the project, with an index, consolidated with whatever is already there |
| **2. Review** | "check this screen", "is this good", "audit the UI" | Findings by rule id, each with the measurement that proves it |
| **3. Build** | "make this page", "add a table", "fix this component" | The work, built under the rules, with a runnable check left behind |
| **4. Loop** | "make it right", "properly", "production" | Mode 2 and 3 run adversarially until reviewers and fixer agree |

If the request fits two modes, or the project state is ambiguous, **do not guess - raise an
Ask Card** (below). Guessing here is expensive: adopting rules over a project that already
has its own, or reviewing all 54 rules when the user wanted two, both waste the whole session.

---

## The Ask Card

The card itself - how many decisions, the `(recommended)` mark, the custom option, the
stated default - is the `kz-askcard` sibling skill. Read `../kz-askcard/SKILL.md` once;
it is short, and it is the same instrument `kz-crew021` uses.

This skill uses its **inline** format: no decision ledger, the answers apply to this run
only. What goes on the card here is the mode and the scope - which of the thirteen
sections, and how deep. A worked example is under mode 2 below.

---

## Learning from mistakes

If `.kz/lessons.jsonl` exists in the project, run `python ../kz-reflect/scripts/reflect.py brief` before
starting: it lists what has already gone wrong here. At close-out, if anything was corrected during
the work and the fix is verified, offer `../kz-reflect/`. It proposes a rule or check change and stops
for a person to approve it.

## Mode 1 - Adopt: put the rules in the project

**Goal:** the project ends up with one design-rule document it owns, and an index that says
what is in it and when to reach for it.

1. **Look first.** Search for existing rules: `docs/`, `AGENTS.md`, `CLAUDE.md`,
   `CONTRIBUTING.md`, `.cursorrules`, a design-system README, Storybook docs, a design
   tokens file. Read what you find before writing anything.
2. **Then one of three:**
   - **Nothing exists** - write `docs/design-rules.md` from the categories that apply to
     this project (a project with no charts does not carry `C1-C21`), plus `docs/README.md`
     as the index: one row per document, what it covers, and *when to reach for it*.
   - **Something exists** - **consolidate, never overwrite.** The project's own rules win
     on every conflict (see the precedence ladder below). Produce a merged document that
     keeps their wording where it exists, adds only what is missing, and lists in a
     "Changed" section every place the two disagreed and which way it was resolved.
   - **Both exist and disagree materially** - Ask Card. Their rule, this rule, or both with
     a scope on each.
3. **Never silently restate.** If a rule here is already covered by the project in
   different words, cite theirs and move on. Two documents saying the same thing in
   different words is how a corpus starts lying.
4. **Index every document in the same change.** A stale index is worse than none, because
   it is believed.

---

## Mode 2 - Review: findings, not opinions

**Ask the card first.** The corpus covers thirteen categories; almost nobody wants all of
them at once. Offer the sections by letter and let the user pick any number:

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
- **Documented departures are not findings.** Where a rule is deliberately departed from
  and it is written down, say so and move on. Undocumented departures are findings.

---

## Mode 3 - Build: under the rules, with a check left behind

1. **Route** with `rules/INDEX.md`: the task's own words name the two or three sections
   that apply. Read those. Nothing else applies unless the work touches a second category.
2. **Build.** Every rule in those sections is in force, plus the always-on set below.
3. **Leave a check.** Non-trivial UI leaves one runnable assertion that fails if the rule
   is broken - a geometry check, a state sweep, a contrast measurement. A rule with no
   check is a rule that gets broken by the person who wrote it, which is documented, with
   examples, in `rules/ui-rules.md` Appendix Z.
   Any table also gets `../kz-uicheck/checks/table-check.js`, which fails a filter that is a
   bare text box, a column with no filter, and a table with no sort.
   Anything with a text field also gets `../kz-uicheck/checks/typing-check.js`, pasted into the browser
   console **at phone width**: it types into the middle of every field and reports one
   that is rebuilt, moved or zoomed by the typing (rule F8). It works on any page, as is.
   The rest of `../kz-uicheck/` applies by what the work contains: `popover-check.js` for any dropdown
   (N2), `modal-check.js` for any modal (N1), `form-check.js` for any form (F1, F2), `focus-check.js`
   for any interactive control, `contrast-check.js` for any text (Y2).
4. **Verify before claiming done**, against the close-out list below. Measure; do not
   assert. And check the instrument first: a viewport of zero width, or a surface that
   never paints a frame, produces confident and wrong numbers.

---

## Mode 4 - Loop: when it has to be right

For work that has to be correct rather than quick. The shape is what makes it honest:
**the reviewer and the fixer are never the same agent, and nobody approves their own work.**

```
build/fix  ->  3 reviewers, independently, against named rule ids
           ->  unanimous pass?  -> done
           ->  any finding      -> a different agent fixes it
           ->  repeat, and a reviewer who was overruled says why
```

- **Three reviewers, not one.** Disagreement is the point: two of three catching the same
  thing is evidence; one reviewer agreeing with the builder is not.
- **The fixer is a different agent from every reviewer.** A fixer reviewing its own fix
  sanitises it, which is the failure this loop exists to prevent.
- **A debugger joins when a finding survives one fix.** A defect that comes back is a
  root-cause problem, not a patch problem.
- **Exit on the gate, never on a round count.** The loop ends when the reviewers are
  unanimous on the actual text or the actual screen - not after three passes.
- **Where the host has a workflow for this, use it** rather than reinventing the loop:
  `kz-crew021` (dispatch, budget gate, per-task verification) or a gauntlet-style
  loop skill. This skill supplies the rules and the verdict criteria; the workflow supplies
  the agents and the budget.

**The speed dial decides whether mode 4 runs at all.** Ask once, in the card:

| Answer | What happens |
|---|---|
| **Fast** | Mode 2 at depth "criticals", then fix what was found. One pass, no loop. |
| **Right** | Mode 3, then mode 4 until unanimous. |

If the user says fast, do not quietly run the loop anyway because the work looks risky -
say in one line what the fast pass is skipping, and proceed as asked.

---

## Always in force, whatever the mode

- **S1** - every table ships a search, sort on every column and a filter per column, with a
  live result count and a distinct no-matches state. **"Filter" means the T1 panel** - a
  button per column that opens sort, a value list with counts and a range for numbers -
  never an empty text box under each header. Read T1-T3 and Appendix A before building one.
  Title and filter rows form one header block, one line under the filters. Where row order is itself content, that
  order is the default and comes back in one click.
- **S2** - every destructive action is behind a confirm that names the target, with a
  clearly labelled cancel. Bulk deletes state the count. Never a bare click.
- **The safety floor** - input validation at trust boundaries, error handling that prevents
  data loss, security, and accessibility basics. A project convention that removes one of
  those is a bug in the convention.

## Order of precedence, highest first

1. An explicit instruction in the current task.
2. The project's own rules, wherever they live.
3. The existing code, when it is consistent. A rule followed on one screen and nowhere else
   is worse than either choice applied consistently.
4. These documents.

**A style or design skill ranks below these rules** - impeccable, or any like it. It decides what
the rules leave open (palette, type, shape language, density, the personality of motion) and
nothing they state. Where its guidance conflicts with a rule here, the rule wins: its line that
"a zero-offset coloured halo is decoration" is about depth at rest, and `B4`'s hover halo stands.
What a style skill generates (tokens, a design file) is a style decision, not a behaviour one: it
cannot remove a rule that has a check.

Departing from a rule is fine; departing silently is not. Say which rule and why, in one
line, at the time.

## The rules themselves

| File | Holds |
|---|---|
| `skills/ui-glance/SKILL.md` | The child skill: a screenshot reviewed in one pass, twenty-two checks, no rule-set read |
| `rules/INDEX.md` | Route by keyword: which rules apply to which job. **Start here.** |
| `rules/ui-rules.md` | The 57 UI rules by category, and the appendices carrying the detail and the figures. Appendix Z is twenty-five mistakes to have read before starting |
| `rules/chart-rules.md` | `C1-C21`: anything that renders data as marks, and the table bound to it |
| `../kz-engrules/rules/engineering-rules.md` | Sibling skill: non-UI rules for code work, where `S1` and `S2` are defined |
| `rules/design-principles.md` | The sixteen principles behind the rules, and the close-out checklist |

Rules are cited by a category letter and a position - `T2` is the second rule about tables,
`V3` the third about verification - so a citation says where to look before you look.

| Letter | Category | Letter | Category |
|---|---|---|---|
| D | Fitting the design system | Y | Type, colour and theming |
| L | Layout, spacing and hierarchy | M | Motion |
| B | Buttons and their explainers | P | Performance and content |
| T | Tables and columns | X | Accessibility and language |
| F | Forms and input | K | Copy |
| A | Actions and feedback | V | Verification |
| N | Overlays and navigation | C / S | Charts / standing rules |

## Before calling any UI work done

1. Every applicable state shipped: loading, empty, error, partial, overflow, no-permission.
2. Layout verified at more than one width, including the narrowest supported, with touch
   emulation - geometry, not only behaviour.
3. Long content tried: a sixty-character name in the longest row, a translated label, zero
   rows, far too many rows.
4. Contrast measured rather than assumed, in both themes.
5. Keyboard path walked: tab order, visible focus, escape from every overlay.
6. After changing one control, every other number on screen re-read.

## For agents that are not Claude

Nothing here depends on a Claude feature. The five files in `rules/` are plain Markdown:
point a file-reading agent at this folder, or paste `rules/INDEX.md` and let the model ask
for the sections it needs. Mode 4 needs a host that can run several agents; where it cannot,
run mode 2 three times with a cleared context between passes and treat agreement across
passes as the gate - weaker, but the same shape.
