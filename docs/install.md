# Install

Eight skills, each a folder with a `SKILL.md`. Install all of them: `kz-uiuxrule` links to `kz-engrules`, `kz-askcard` and `kz-uicheck` as siblings, and `kz-crew021` calls most of the others.

## Claude Code, as a plugin

```
/plugin marketplace add kz-95/kz-skills
/plugin install kz-skills@kz-skills
```

Then `/kz-uiuxrule` for UI work, or `/kz-skill` when you are not sure which skill fits.

> **Status:** the manifest in `.claude-plugin/` follows the shape of other marketplace plugins, but this repository has not yet been installed from GitHub as a plugin. If the commands above fail, use the manual route below and open an issue.

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
3. For a UI task it reads `skills/kz-uiuxrule/rules/INDEX.md`, matches the task's words to a section, and reads only that.
4. The checks in `skills/kz-uicheck/checks/` are plain JavaScript. Paste each into the browser console of the page being checked.

## The purpose hook (optional)

`skills/kz-askcard/hooks/ui-rule-purpose.mjs` makes a skill ask what it is for before it acts. It reads a JSON payload on stdin, never blocks, and works with any host that can run a command before a skill call. It has only been tested on Claude Code. Wiring, including the two Claude Code entries it needs (one for a skill the model calls, one for a command you type), is in [`skills/kz-askcard/hooks/README.md`](../skills/kz-askcard/hooks/README.md).

## It does not show up as a command

The usual cause is **nesting**. Claude Code registers `skills/<name>/SKILL.md` and nothing deeper. If a skill sits inside another skill's folder, it is read by its parent but is not a command. Each of the eight must be a direct child of your skills folder:

```
~/.claude/skills/
  kz-skill/SKILL.md
  kz-uiuxrule/SKILL.md
  kz-uicheck/SKILL.md      <- not ~/.claude/skills/kz-skill/skills/kz-uicheck/
  ...
```

Check the frontmatter `name:` matches the folder name, then reopen the window.
