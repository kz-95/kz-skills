# AGENTS.md

Instructions for any AI agent that **uses** or **works in** this repository: Claude Code, Codex, Cursor, GPT-based agents and others. Plain Markdown, no host-specific syntax.

## What this repository is

Eight skills, each a folder under `skills/` with a `SKILL.md`. The core is `kz-uiuxrule`: stack-neutral, style-neutral UI rules (57 UI rules, 21 chart rules, 16 principles), each with the failure it prevents and a browser check that catches it. `kz-uicheck` holds those checks as paste-in console scripts.

## Using the skills when you are not Claude Code

1. **Read `skills/kz-skill/SKILL.md` first.** It is a router. It names which skill fits the task and says what to read, so you never need the whole set.
2. **For any UI work, read `skills/kz-uiuxrule/rules/INDEX.md`.** Find the row whose keywords match the task (`table`, `form`, `chart`, `dark mode`, `back button`). It names the two or three sections that apply. Read those, and nothing else unless the work touches a second category.
3. **Quote rule IDs** (`T1`, `F8`, `C5`) when you report a finding or justify a choice. They are stable.
4. **Before saying UI work is done, run the checks** in `skills/kz-uicheck/checks/`. Paste each into the browser console of the page, one at a time, on a settled page: at a wide width, at a narrow one, and at 375px with touch emulation. A finding without a measurement behind it is not a finding.
5. **Ask what the work is for before doing it**, as one card with three to five decisions, one marked recommended and a custom option always open. The format is in `skills/kz-askcard/SKILL.md`.

If your host can run a command before a skill is invoked, `skills/kz-askcard/hooks/ui-rule-purpose.mjs` enforces step 5. It is host-neutral and never blocks. It has only been tested on Claude Code.

## Working in this repository

- **One copy of each rule.** Rules live in `skills/kz-uiuxrule/rules/` only. `docs/rule-index.md` is generated: run `python scripts/build-index.py`, never edit it by hand.
- **Never renumber a rule ID.** Other people's agents cite them. Retire a rule by saying so in place.
- **Every new rule ships with a check** that fails when it is broken, and a wrong/right sample on the reference page whose wrong half is asserted to still fail. A check that has never failed is a decoration.
- **Skills stay direct children of `skills/`.** A skill nested inside another is not registered as a command.
- **If you change a wrong/right sample the carousel shows (`t1-filter`, `l1-hierarchy`, `c5-ring`, `l5-height`, `b1-icons`, `t3-explain`, `y2-plate`, `b4-halo`), run `python scripts/make-carousel.py`** so the README picture matches the rule. It needs Pillow and Chrome.
- **Run `python scripts/validate.py` before proposing a change.** It checks frontmatter, relative links and that the rule index is current.
- **Line endings are LF.** `.gitattributes` enforces it.
- **Do not use a CSS variable you have not seen defined.** An undefined `var(--x)` drops the whole declaration without an error.

## Git

- Work on a feature branch named after the work in kebab-case (`docs/`, `fix/`, `feat/`, `chore/` prefix). Never commit or push directly to `main`, and never put a tool, model or agent name in a branch name.
- Commits are authored by the human making them. Do not add `Co-authored-by` or any trailer naming an AI, a tool or a model.
