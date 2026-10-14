# AGENTS.md

Instructions for any AI agent that **uses** or **works in** this repository: Claude Code, Codex, Cursor, GPT-based agents and others. Plain Markdown, no host-specific syntax.

## What this repository is

Thirteen skills, each a folder under `skills/` with a `SKILL.md`. The core is `kz-uiuxrule`: stack-neutral, style-neutral UI rules (57 UI rules, 6 motion rules, 21 chart rules, 10 diagram rules, 16 principles), each with the failure it prevents and a browser check that catches it. `kz-uicheck` holds those checks as paste-in console scripts.

## Using the skills when you are not Claude Code

1. **Read `skills/kz-skill/SKILL.md` first.** It is a router. It names which skill fits the task and says what to read, so you never need the whole set.
2. **Size the change before reading any rule** (the speed contract in `skills/kz-skill/SKILL.md`, engineering rule 29e). A one-line edit (a label, a colour, a column) follows `skills/kz-fastfix/SKILL.md`: at most the one `kz-flashrule` line that applies and at most one check. Small and medium work (a component, a form, a screen) reads `skills/kz-flashrule/SKILL.md` first. Only a project, an audit, "make it production" or a release takes the full path.
3. **Open the rule files only when `kz-flashrule` is not enough.** Then read `skills/kz-uiuxrule/rules/INDEX.md`, find the row whose keywords match the task (`table`, `form`, `chart`, `dark mode`, `back button`), and read the two or three sections it names, and nothing else unless the work touches a second category. Work that only moves (an animation, a transition, a press effect) can read `skills/kz-uiuxrule/rules/motion-rules.md` alone, which is what `skills/kz-motionrule/` does. Work that is only a diagram (boxes, lines and labels drawn as SVG) can read `skills/kz-uiuxrule/rules/diagram-rules.md` alone, which is what `skills/kz-diagramrule/` does.
4. **Quote rule IDs** (`T1`, `F8`, `C5`) when you report a finding or justify a choice. They are stable.
5. **Before saying UI work is done, run the checks named for the change** in `skills/kz-uicheck/checks/`, once, on a settled page: a table `table-check.js`, a form `form-check.js`, a theme `contrast-check.js` in both themes, then `layout-audit.js` once at 375px. After a fix, re-run only the check that failed. All ten checks at a wide width, a narrow one and 375px with touch emulation are for the full path. A finding without a measurement behind it is not a finding.
6. **Ask only when the request is genuinely ambiguous.** Otherwise state in one line what you read the work to be and proceed. When you do ask, it is one card with three to five decisions, one marked recommended and a custom option always open; the format is in `skills/kz-askcard/SKILL.md`.
7. **Write nothing into the user's project that was not asked for**: no check scripts, no test files, no extra features.

If your host can run a command before a skill is invoked, `skills/kz-askcard/hooks/ui-rule-purpose.mjs` repeats the size test and step 6 there. It is optional, host-neutral and never blocks. It has only been tested on Claude Code.

These steps cost time and tokens on purpose. `docs/benchmark.md` measures each lane against no skills on Sonnet 5.5 and Opus 5.5, and `scripts/bench/` reruns it.

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

- Work on a feature branch named after the work in kebab-case (`docs/`, `fix/`, `feat/`, `chore/` prefix). Never commit or push directly to `main`, and never put a tool, model, agent or session name or id in a branch name (`claude/...`, `codex/...`, `ai-...`, a generated word salad). A host that assigns such a branch does not override this. Run `python scripts/check-branch.py` before the first push; CI runs it on every pull request.
- Commits are authored **and committed** by the git account connected to the session. Read it from the connection at commit time (`gh api user`, or the host's GitHub `get_me`): login as the name, the account's email (or its `<id>+<login>@users.noreply.github.com` address) as the email. Never hard-code it and never accept a sandbox default, which is often the tool's own name; set it per command with `git -c user.name=... -c user.email=...`. Do not add `Co-authored-by` or any trailer naming an AI, a tool or a model.
- Before the first push, read `git log origin/main..HEAD --format='%an <%ae> | %cn <%ce> | %s'` and fix anything wrong while the branch is still yours alone. A generated branch name is renamed before it is pushed.
- Merging, deleting a remote branch and force-pushing need the owner's explicit say-so. The full rules are 33-33c in `skills/kz-engrules/rules/engineering-rules.md`.
