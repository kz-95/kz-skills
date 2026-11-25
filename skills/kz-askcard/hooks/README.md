# The purpose hook

`ui-rule-purpose.mjs` points a kz skill the right way before it does anything.

**The first kz call in a session gets the first-call card.** Any skill whose name starts with `kz-` triggers it once per session.
It tells the model to ask one Ask Card with two lines: the type of work and the size.
The type options are the rows of `../../kz-uiuxrule/packs/LOOKUP.md`, read at run time, and the pack whose keywords the prompt's words match is marked `(recommended)`.
The size options are trivial, component and project, with `kz-fastfix` recommending trivial, `kz-crew021` project and every other skill component.
The answer picks one generated pack; the model reads LOOKUP, that pack, and runs only that pack's checks on the screen the work is on.
Later kz calls in the same session print no first-call card: the answer is reused.

"First" is tracked by the payload's `session_id` (or `sessionId`, `conversation_id`): the hook writes a marker file named after it in the system temp folder (`os.tmpdir()`).
With no session id it cannot tell, so it prints the first-call card every time.

Two skills also carry a card of their own, printed on every call:

- `kz-uiuxrule`: **size the change first** (the speed contract in
  `../../kz-skill/SKILL.md`): a trivial change goes the `kz-fastfix` way with at most one
  check, a component reads LOOKUP and one pack and runs only that pack's checks, and only a
  project, audit or release takes the full path. After the first-call card it asks **only
  when the mode or scope is genuinely unclear**.
- `kz-crew021`: what run, which phase, what budget, what weight - one card first, because
  that workflow spends a budget.

On a first call to one of those two, the type and size lines go on the same card: one card per turn.
Adding another skill card is one entry in `CARDS`; nothing else changes. The same text is
written into each skill, but a document can be skimmed past by a model that has decided it
already knows; a hook cannot.

It is host-neutral on purpose. It reads a JSON payload on **stdin**, or a single JSON
argument, or a bare skill name as an argument, and prints **only** for a `kz-` skill -
matching a plugin-qualified or path-qualified name by its last segment. Anything else,
including the `ui-glance` child skill, exits silently with status 0: a pasted screenshot has
already said what it wants. The words it matches against the packs come from the payload's
`prompt`, or the skill call's `args`.

Output adapts to the payload:

| Payload contains | Output |
|---|---|
| `hook_event_name` or `tool_name` | Claude Code's `{"hookSpecificOutput":{"additionalContext":...}}` envelope |
| anything else | the instruction as plain text on stdout |

**It never blocks.** Exit status is always 0, and nothing is written to stderr; an error
inside it (an unreadable LOOKUP, a temp folder it cannot write) falls back to printing, never
to failing. A hook that
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
echo '{"skill":"kz-uiuxrule"}' | node hooks/ui-rule-purpose.mjs   # first-call card + size test
echo '{"session_id":"t1","prompt":"/kz-flashrule add a toast"}' | node hooks/ui-rule-purpose.mjs   # card, feedback recommended
echo '{"session_id":"t1","prompt":"/kz-flashrule again"}' | node hooks/ui-rule-purpose.mjs   # prints nothing: answered
echo '{"skill":"something-else"}'       | node hooks/ui-rule-purpose.mjs   # prints nothing
```

Then point your host's pre-skill command at it and confirm the text reaches the model. If
the host passes a payload this script does not recognise, the fix is one line in
`skillNameOf()` - add the field your host uses. Send it back and it can ship here.

## Without any hook at all

`kz-skill`'s speed contract states the first-call card, `kz-uiuxrule`'s `SKILL.md` opens
with **Step zero: the size test**, and `kz-crew021`'s with **Step zero: ask what this run is
for**. On a host with no hook mechanism, those
sections are the requirement, and they come first in each file for that reason.
