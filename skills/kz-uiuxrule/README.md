# kz-uiuxrule

Stack-neutral, style-neutral UI rules: 56 UI rules, 21 chart rules, two standing rules and
fifteen principles. Each rule states an obligation and the failure that follows when it is
missed. Nothing here names a framework, a component library, a palette or a typeface.

## Install

**Claude Code / Claude.ai** - this is a child of the `kz-skill` skillset. Copy the whole
set, or this folder alone:

```bash
cp -r kz-skill ~/.claude/skills/
```

```bash
cp -r kz-uiuxrule ~/.claude/skills/
```

Then invoke it with `/kz-uiuxrule`, or let it trigger on UI work.

**Any other agent (GPT, Gemini, Cursor, Copilot, a local model)** - the rules are plain
Markdown with no host-specific syntax. Three ways to use them:

1. **Point the agent at the folder.** Anything that can read files: "read
   `kz-uiuxrule/rules/INDEX.md`, follow it to the sections that apply to this
   task, then build."
2. **Paste the routing file.** `rules/INDEX.md` is short. Paste it, let the model name the
   sections it needs, paste those.
3. **Put it in the project's own instruction file** - `AGENTS.md`, `.cursorrules`, a system
   prompt. `SKILL.md` is written to work as that instruction file unchanged.

For a small context window, paste `rules/INDEX.md` alone and let the model ask for the two
or three sections it needs. The whole corpus is roughly 3,600 lines; almost no task needs
more than a tenth of it.

## What it does

Four modes, picked from the request before anything else happens:

| Mode | Sounds like | Produces |
|---|---|---|
| **Glance** | a pasted screenshot, "quick look" | Three to six findings by rule id, from the picture alone - the child skill, one read, no questions |
| **Adopt** | "set up design rules for this project" | A design-rule doc the project owns, plus its index - consolidated with whatever rules already exist, never overwriting them |
| **Review** | "check this screen" | Findings by rule id, each carrying the measurement that proves it |
| **Build** | "make this page" | The work built under the rules, with a runnable check left behind |
| **Loop** | "make it right" | Three independent reviewers against a separate fixer, until unanimous |

Where it is unsure - two modes fit, or the project already has rules that disagree - it
raises a single **Ask Card** rather than guessing, and a review always asks which of the
thirteen sections to cover before reading every rule at someone.

A **speed dial** decides how much of that runs: *fast* is one review pass and the fixes,
*right* runs the full loop. It says what a fast pass skips rather than quietly doing more
than was asked.

## What is in here

| File | Holds |
|---|---|
| `SKILL.md` | The entry point: how to route, the standing rules, the precedence ladder, the close-out list |
| `skills/ui-glance/SKILL.md` | **Child skill** - paste a screenshot, get three to six findings by rule id in one read. No questions, no rule-set lookup |
| `rules/INDEX.md` | Keyword to category to rules. Start every task here |
| `rules/ui-rules.md` | The 56 UI rules and the appendices carrying their detail, including **Appendix Z: twenty-six things not to do**, each one learned by doing it |
| `rules/chart-rules.md` | C1-C21, for anything that renders data as marks |
| `../kz-engrules/rules/engineering-rules.md` | Sibling skill: non-UI rules for code work, where S1 and S2 are defined |
| `rules/design-principles.md` | The sixteen principles, and why each rule exists |
| `../kz-askcard/hooks/ui-rule-purpose.mjs` | Sibling skill. Host-neutral hook that makes the skill ask its purpose before acting - stdin JSON, JSON arg or bare name; fires only for this skill; never blocks |
| `../kz-askcard/hooks/README.md` | How to wire that hook, and which wiring has actually been tested |

## What it is not

It does not pick a style. No palettes, no font pairings, no "use this framework". Those
date, and they argue with whatever design system the project already has - which wins
anyway. A rule that survives the choice of style is the only kind in here.

It is also not a linter. Rules state checkable observations so that a check *can* be
written, and the project it came from has three of them, but the corpus itself is
documentation.

## Provenance

Grown from defects found while building and reviewing a real interface: each rule records
the failure that produced it. A handful of later rules - performance, internationalization,
state restoration, cognitive load - came from outside that build and are marked as such in
`rules/design-principles.md`, under "What has no principle behind it". They are held to a
weaker standard than the rest, deliberately and in writing.
