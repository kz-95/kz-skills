---
name: kz-engrules
description: Stack-neutral engineering rules for any code work, UI or not - L0 always-on behaviour and honesty, L1 for any code task (understand first, fit the codebase, size the solution, quality bar, scope discipline, close out), and the S standing rules. Includes ASCII discipline with a PostToolUse hook that enforces it, and the rule on composing rather than copying. Use before starting any code task, and when closing one out. Triggers on "/kz-engrules", "engineering rules", "code rules", "what rules apply here".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-engrules

The rules that apply to all work, not only work that renders. Sibling of
`kz-uiuxrule`, which carries the interface rules and sits on top of these.

| File | Holds |
|---|---|
| `rules/engineering-rules.md` | The corpus: L0, L1, S, and the two appendices |
| `hooks/ascii-punct.py` | Enforces rule 7 after every file write, rather than relying on remembering it |

## Three layers

- **L0, always** - think before acting, never invent project facts, assume rather than
  ask when assuming is safe, ASCII only, no AI attribution, close with a summary.
- **L1, any code work** - understand first, fit the codebase, climb the size ladder
  *after* understanding, quality bar, scope discipline, close out.
- **S, standing** - fire in any layer whenever their trigger appears, including inside
  UI work. `S1` (tables ship search, sort and filter) and `S2` (destructive actions are
  confirmed) are repeated in `kz-uiuxrule` because they apply to both; they are defined
  here.

Rules are defaults, not laws. The precedence ladder is at the top of the corpus: the
current task's instruction, then the project's own rules, then the existing code when it
is consistent, then this file. Departing is fine; departing silently is not.

The safety floor does not bend, whatever the project says - validation at trust
boundaries, error handling that prevents data loss, security, accessibility basics, and
the `S2` confirm.

## The ASCII hook

`hooks/ascii-punct.py` is a PostToolUse hook: it rewrites typographic punctuation to
ASCII after a write and reports what it changed, so the change is never silent. It is
deliberately conservative - only punctuation with an exact ASCII counterpart, never
letters, CJK, emoji or accented characters.

Wire it in `.claude/settings.json`:

```json
{ "hooks": { "PostToolUse": [ { "matcher": "Write|Edit|MultiEdit", "hooks": [
  { "type": "command", "command": "python \"<path to>/kz-engrules/hooks/ascii-punct.py\"" } ] } ] } }
```

Rule 7 says why this is a hook and not a habit: the glyphs arrive from paste, from a
model's own output, and from tools that "helpfully" curl quotes, and none of them
announce themselves.
