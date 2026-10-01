# The purpose hook

`ui-rule-purpose.mjs` makes a skill ask what it is for before it does anything. It carries
a card per skill - today `kz-uiuxrule` (which mode, which sections, fast or right)
and `kz-crew021` (what run, which phase, what budget, what weight). Adding another is
one entry in `CARDS`; nothing else changes.

The requirement is also written into each skill, but a document can be skimmed past by a
model that has decided it already knows; a hook cannot.

It is host-neutral on purpose. It reads a JSON payload on **stdin**, or a single JSON
argument, or a bare skill name as an argument, and prints a card **only** for a skill in its
table - matching a plugin-qualified or path-qualified name by its last segment. Anything
else, including the `ui-glance` child skill, exits silently with status 0: a pasted
screenshot has already said what it wants.

Output adapts to the payload:

| Payload contains | Output |
|---|---|
| `hook_event_name` or `tool_name` | Claude Code's `{"hookSpecificOutput":{"additionalContext":...}}` envelope |
| anything else | the instruction as plain text on stdout |

**It never blocks.** Exit status is always 0, and nothing is written to stderr. A hook that
can block a skill is a hook that can strand someone at 2am over a card they cannot answer.

## What it needs from a host

Three things, which most agent runners have in some form:

1. a point to run a command **before** a skill or tool call,
2. a way to hand that command the name of what is being invoked - stdin JSON, an argument,
   or an environment variable your wrapper turns into an argument,
3. the command's stdout fed back into the model's context.

If your host gives you (1) and (3) but not (2), wire the hook to fire on *all* skill calls
and pass the skill name yourself - the script accepts `node ui-rule-purpose.mjs "<name>"`.

## Verified wiring

**Claude Code** - tested on this machine, works:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Skill",
        "hooks": [
          { "type": "command",
            "command": "node \"<path>/hooks/ui-rule-purpose.mjs\"",
            "timeout": 5 }
        ]
      }
    ]
  }
}
```

**Wire it twice.** The entry above catches a skill the *model* decides to call. A slash
command the *user types* - `/kz-uiuxrule review this` - never goes through a
tool call: the host loads the skill straight into the conversation, and a `PreToolUse`
hook never sees it. That is the commonest way in, so the same script also listens on the
prompt, where it matches a leading `/<skill-name>` and nothing else:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command",
            "command": "node \"<path>/hooks/ui-rule-purpose.mjs\"",
            "timeout": 5 }
        ]
      }
    ]
  }
}
```

A prompt that merely mentions a skill by name passes through silently; only a leading
slash is a call.

Put both in `~/.claude/settings.json` (all projects) or `.claude/settings.json` (this
project). Merge with any hooks already there - do not replace the array. On Windows,
write the path to `node.exe` with forward slashes: a backslash in a JSON string written by
a script is one escape away from `\n`, and a hook whose command contains a newline fails
without a word.

## Other hosts

Several agent runners - Codex CLI, Cursor, and others - support hooks or pre-command rules,
and this script is written to suit them. **Their exact config key and payload shape are not
documented here, because they have not been tested against this script**, and a config
snippet that looks authoritative and is wrong costs more than no snippet at all.

To wire one, you need the three things above. The quickest check, before touching any
config:

```bash
echo '{"skill":"kz-uiuxrule"}' | node hooks/ui-rule-purpose.mjs   # prints the card
echo '{"skill":"something-else"}'       | node hooks/ui-rule-purpose.mjs   # prints nothing
```

Then point your host's pre-skill command at it and confirm the text reaches the model. If
the host passes a payload this script does not recognise, the fix is one line in
`skillNameOf()` - add the field your host uses. Send it back and it can ship here.

## Without any hook at all

`SKILL.md` opens with **Step zero: ask what this is for**. On a host with no hook
mechanism, that section is the requirement, and it is the first thing in the file for that
reason.
