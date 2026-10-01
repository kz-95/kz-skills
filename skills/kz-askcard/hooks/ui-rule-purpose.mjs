#!/usr/bin/env node
/* Ask the purpose before a big skill does anything.

   Two skills here are expensive to point in the wrong direction: a rule corpus with four
   modes, and a project workflow that can spend a budget. Both have the same failure -
   a model that decides what the user meant and is wrong - so both are gated the same way:
   one card, asked first, then work.

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
    "MANDATORY FIRST STEP - do not read rules, edit files, or plan until this is answered.",
    "",
    "The kz-uiuxrule skill has four modes. Ask the user which one, as a single",
    "Ask Card, before any other action. Use the host's question UI where there is one;",
    "otherwise print the card and stop for an answer.",
    "",
    "  0. GLANCE - a screenshot, one pass (the ui-glance child skill; no card needed)",
    "  1. ADOPT  - put design rules into this project (consolidating any that already exist)",
    "  2. REVIEW - check existing UI against the rules, and which of the 13 sections to cover",
    "  3. BUILD  - build or change UI under the rules, leaving a check behind",
    "  4. LOOP   - build, then three independent reviewers against a separate fixer",
    "",
    "Ask in the same card, because both change what gets done:",
    "  - Scope: which sections (D L B T F A N Y M P X K V), or let the skill propose from the repo",
    "  - Speed: FAST (one review pass and the fixes) or RIGHT (the full loop until unanimous)",
    "",
    "EVERY question carries a recommendation and a way out:",
    "  - Read the repo first, then mark ONE option (recommended) - the one you would pick,",
    "    and say in four words why. A card with no recommendation makes the user do the",
    "    skill's thinking for it.",
    "  - Always leave a custom option open, so a user whose answer is not on the card can",
    "    say so instead of picking a wrong one to get moving.",
    "",
    "State what you will assume if the user does not answer, so silence still makes progress.",
    "If the user already named the mode and the scope in their request, say which you read",
    "from it in one line and proceed - do not ask a question they have already answered.",
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
