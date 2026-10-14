#!/usr/bin/env node
/* Point a big skill in the right direction before it does anything.

   Two skills here are expensive to point the wrong way: a rule corpus with four modes, and
   a project workflow that can spend a budget. For kz-uiuxrule the card is the size test
   (most UI work is small, and the full path made it 2.5x slower - docs/benchmark.md) and an
   ask only when the mode or scope is genuinely unclear. For kz-crew021 it is one card,
   asked first, then work.

   HOST-NEUTRAL BY DESIGN. It reads a JSON payload on stdin (or a single JSON argument, or
   a bare skill name as an argument), matches the skill being invoked against the table
   below, and prints that skill's card. Output shape follows the payload:

     - a payload carrying `hook_event_name`/`tool_name` (Claude Code) gets that host's
       `hookSpecificOutput.additionalContext` envelope
     - anything else gets the card as plain text on stdout

   Exit code is always 0: this hook informs, it never blocks. A hook that can block a skill
   is a hook that can strand someone at 2am over a card they cannot answer.

   Adding a skill: one entry in CARDS. Nothing else changes.

   Wiring it: see hooks/README.md. */

const CARDS = {
  "kz-uiuxrule": [
    "FIRST: SIZE THE CHANGE, before reading any rule (the speed contract in kz-skill/SKILL.md).",
    "",
    "  TRIVIAL (one element or one line, no new behaviour): treat it as kz-fastfix - at most",
    "    the one kz-flashrule line that applies, at most the one check that covers it,",
    "    a one-line report. Do not read INDEX.md or the rule files.",
    "  SMALL/MEDIUM (a component or a screen): read kz-flashrule first; open an INDEX section",
    "    only when a flashrule line points there. Run only the checks for what you touched,",
    "    once; after a fix re-run only that check.",
    "  LARGE (a project, an audit, 'make it production', a release): the full path.",
    "",
    "Do not ask unless it is genuinely ambiguous. If the request names the work, say in one",
    "line which mode and scope you read from it and proceed. Ask one Ask Card only when the",
    "mode or scope is really unclear (adopt vs review, which sections to review, the",
    "project's own rules disagree): 3-5 decisions, ONE marked (recommended) with four words",
    "of why, a custom option always open, and the default you will assume if unanswered.",
    "",
    "Modes: 0 GLANCE (screenshot, ui-glance) | 1 ADOPT | 2 REVIEW | 3 BUILD | 4 LOOP.",
    "Write nothing into the user's project that was not asked for: no check scripts, no",
    "test files, no extra features.",
  ].join("\n"),

  "kz-crew021": [
    "MANDATORY FIRST STEP - do not dispatch, plan, or write files until this is answered.",
    "",
    "This workflow spends a budget across a crew of agents. Pointing it at the wrong thing",
    "is the most expensive mistake available here, so ask first, as a single Ask Card:",
    "",
    "  1. What is this run?   [ new project | continue an existing one | one task | a retro ]",
    "  2. Which phase?        [ initialize | poc | pre-production | production | maintenance ]",
    "  3. Budget for it?      [ tokens, or 'no cap' - it sets the gate, not just the report ]",
    "  4. Weight?             [ fast: one attempt per task | right: reviews and the fix loop ]",
    "",
    "Mark ONE option per question as (recommended) - the one the repo points at - and",
    "always leave a custom option open. A card that offers no recommendation hands the",
    "thinking back to the user; a card with no way out makes them pick something wrong to",
    "get moving.",
    "",
    "Before asking, look: run `pb.py ready` and read `.pb/` if it exists. A project already",
    "under way answers questions 1 and 2 by itself, and a card that asks what the repo",
    "already says wastes the user's turn. Ask only what the repo cannot tell you.",
    "",
    "State what you will assume if the user does not answer. If the request already names",
    "the phase and the scope, say what you read from it in one line and proceed.",
    "",
    "If the work renders anything, the UI decisions belong on this same card - see the",
    "kz-uiuxrule section of the skill. Two cards for one turn is one too many.",
  ].join("\n"),
};

/* every field a host might use to name the thing being invoked */
function skillNameOf(payload) {
  const input = payload.tool_input || payload.input || payload.arguments || {};
  const candidates = [
    input.skill, input.name, input.skill_name, input.command,
    payload.skill, payload.skill_name, payload.name, payload.command,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c) { return c; }
  }
  /* A slash command the user TYPES never goes through a tool call - the host loads the
     skill straight into the conversation - so a pre-tool hook alone misses the commonest
     way in. Wired on the prompt as well, it sees "/kz-uiuxrule ..." here.
     Only a leading slash counts: a sentence that merely mentions a skill is not a call. */
  if (typeof payload.prompt === "string") {
    const m = /^\s*\/([\w.:\/-]+)/.exec(payload.prompt);
    if (m) { return m[1]; }
  }
  return "";
}

function cardFor(name) {
  const clean = name.replace(/^\//, "").trim();
  if (CARDS[clean]) { return CARDS[clean]; }
  /* a plugin-qualified or path-qualified name still matches its last segment */
  const tail = clean.split(/[/:]/).pop();
  return CARDS[tail] || null;
}

function emit(payload) {
  const card = cardFor(skillNameOf(payload));
  if (!card) { process.exit(0); }            /* every other skill passes through */

  const claudeShaped = "hook_event_name" in payload || "tool_name" in payload;
  if (claudeShaped) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: payload.hook_event_name || "PreToolUse",
        additionalContext: card,
      },
    }));
  } else {
    process.stdout.write(card + "\n");
  }
  process.exit(0);
}

/* an argument wins over stdin, so a host that passes JSON as argv works too */
const arg = process.argv[2];
if (arg) {
  let payload = {};
  try { payload = JSON.parse(arg); } catch { payload = { skill: arg }; }
  emit(payload);
} else {
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => { raw += c; });
  process.stdin.on("end", () => {
    let payload = {};
    try { payload = JSON.parse(raw || "{}"); } catch { payload = {}; }
    emit(payload);
  });
  /* no stdin at all (a host that just runs the command): say nothing rather than guess */
  setTimeout(() => { if (!raw) { process.exit(0); } }, 2000).unref?.();
}
