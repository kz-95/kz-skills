# Install

Thirteen skills, each a folder with a `SKILL.md`. Install all of them: `kz-uiuxrule` links to `kz-engrules`, `kz-askcard` and `kz-uicheck` as siblings, and `kz-crew021` calls most of the others.

## Any agent, with the skills CLI

```bash
npx skills add kz-95/kz-skills
```

The [`skills` CLI](https://skills.sh) installs every skill into the skills folder of each agent you pick.
Add `-l` to list the skills without installing, or `--skill kz-uiuxrule` to take one.

## Claude Code, as a plugin

```
/plugin marketplace add kz-95/kz-skills
/plugin install kz-skills@kz-skills
```

From a terminal, the same two steps are:

```bash
claude plugin marketplace add kz-95/kz-skills
claude plugin install kz-skills@kz-skills
```

The plugin installs and enables all thirteen skills.
Then call the lane that fits: `/kz-fastfix` for a one-line edit, `/kz-flashrule` for everyday UI building, `/kz-uiuxrule` for reviews, audits and "make it production", or `/kz-skill` when you are not sure which skill fits.
The skills cost time and tokens on purpose; [`benchmark.md`](benchmark.md) has the measured cost of each lane on Sonnet 5.5 and Opus 5.5.

### Updating

The plugin pins no version, so every commit on `main` is a new version. To update now:

```bash
claude plugin marketplace update kz-skills
claude plugin update kz-skills@kz-skills
```

Then run `/reload-plugins` in an open session, or restart it. To update on its own instead, turn it on once: `/plugin` > Marketplaces > `kz-skills` > Enable auto-update (off by default for marketplaces that are not official). A manual install has no updater: `git pull` the clone and copy `skills/*` again.

## Claude Code, by hand

```bash
git clone https://github.com/kz-95/kz-skills.git
cp -r kz-skills/skills/* ~/.claude/skills/
```

Windows PowerShell:

```powershell
git clone https://github.com/kz-95/kz-skills.git
Copy-Item kz-skills\skills\* $HOME\.claude\skills -Recurse
```

Reopen the window afterwards: the `/` menu reads the skill list at startup.

## GPT, Codex, Cursor and other agents

The skills are plain Markdown. There is no build step.

1. Give your agent the repository, or the `skills/` folder, wherever it reads skills or instructions.
2. Point it at [`AGENTS.md`](../AGENTS.md), which says how to use the rules without Claude Code, and at [`llms.txt`](../llms.txt).
3. For a UI task it sizes the change first (the speed contract in `skills/kz-skill/SKILL.md`): a one-line edit follows `skills/kz-fastfix/SKILL.md`, everyday building reads `skills/kz-flashrule/SKILL.md` first, and only when that page is not enough does it open `skills/kz-uiuxrule/rules/INDEX.md`, match the task's words to a section, and read only that.
4. The checks in `skills/kz-uicheck/checks/` are plain JavaScript. Paste the ones named for the change into the browser console of the page being checked; all ten are for an audit or a release.

## The purpose hook (optional)

`skills/kz-askcard/hooks/ui-rule-purpose.mjs` points a skill the right way before it acts: for `kz-uiuxrule` the size test and an ask only when the mode or scope is genuinely unclear, for `kz-crew021` one card first. It reads a JSON payload on stdin, never blocks, and works with any host that can run a command before a skill call. It has only been tested on Claude Code. Wiring, including the two Claude Code entries it needs (one for a skill the model calls, one for a command you type), is in [`skills/kz-askcard/hooks/README.md`](../skills/kz-askcard/hooks/README.md).

## It does not show up as a command

The usual cause is **nesting**. Claude Code registers `skills/<name>/SKILL.md` and nothing deeper. If a skill sits inside another skill's folder, it is read by its parent but is not a command. Each of the thirteen must be a direct child of your skills folder:

```
~/.claude/skills/
  kz-skill/SKILL.md
  kz-uiuxrule/SKILL.md
  kz-uicheck/SKILL.md      <- not ~/.claude/skills/kz-skill/skills/kz-uicheck/
  ...
```

Check the frontmatter `name:` matches the folder name, then reopen the window.
