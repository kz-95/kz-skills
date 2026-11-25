#!/usr/bin/env node
/* Point a kz skill in the right direction before it does anything.

   FIRST KZ CALL IN A SESSION: one Ask Card with two lines, type and size. The type comes
   from the rows of kz-uiuxrule/packs/LOOKUP.md, with the pack whose keywords the prompt
   matches marked (recommended); the size is trivial / component / project. The answer
   picks one generated pack, and the agent reads that pack and runs only its checks. Later
   kz calls in the same session reuse the answer, so the card is printed once per session.

   "First" is tracked per session: the payload's session id names a marker file in the
   system temp folder. With no session id the card is printed every time (a repeated hint
   costs a few lines; a missing one costs the routing).

   Two skills also carry a card of their own: kz-uiuxrule (size the change, read one pack)
   and kz-crew021 (what run, which phase, what budget, what weight). On the first call the
   type and size lines join that card: one card per turn.

   HOST-NEUTRAL BY DESIGN. It reads a JSON payload on stdin (or a single JSON argument, or
   a bare skill name as an argument), and prints for kz skills only. Output shape follows
   the payload:

     - a payload carrying `hook_event_name`/`tool_name` (Claude Code) gets that host's
       `hookSpecificOutput.additionalContext` envelope
     - anything else gets the text as plain stdout

   Exit code is always 0: this hook informs, it never blocks. A hook that can block a skill
   is a hook that can strand someone at 2am over a card they cannot answer.

   Wiring it: see hooks/README.md. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CARDS = {
  "kz-uiuxrule": [
    "SIZE THE CHANGE, before reading any rule (the speed contract in kz-skill/SKILL.md).",
    "",
    "  TRIVIAL (one element or one line, no new behaviour): treat it as kz-fastfix - at most",
    "    the one kz-flashrule line that applies, at most the one check that covers it,",
    "    a one-line report.",
    "  COMPONENT (a component or a screen): read kz-uiuxrule/packs/LOOKUP.md, then the one",
    "    pack it names; run only that pack's checks, once, on the screen the work is on.",
    "  PROJECT (a project, an audit, 'make it production', a release): the full path.",
    "",
    "After the first-call card, do not ask unless it is genuinely ambiguous: say in one line",
    "which mode and scope you read and proceed.",
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
    "always leave a custom option open.",
    "",
    "Before asking, look: run `pb.py ready` and read `.pb/` if it exists. A project already",
    "under way answers questions 1 and 2 by itself. Ask only what the repo cannot tell you.",
    "State what you will assume if the user does not answer.",
    "",
    "If the work renders anything, the UI decisions belong on this same card. Two cards for",
    "one turn is one too many.",
  ].join("\n"),
};

/* Used only when packs/LOOKUP.md cannot be read (a copy without kz-uiuxrule beside it). */
const FALLBACK_PACKS = [
  ["feedback", "toast, snackbar, notification, undo, saved, save, loading, progress, delete, remove, confirm"],
  ["explain", "tooltip, icon button, [?], hint, help, explainer, hover, halo"],
  ["table", "table, list, grid, rows, column, filter, sort, search, pagination, total"],
  ["chart", "chart, graph, plot, legend, axis, series, KPI, dashboard, data viz"],
  ["form", "form, field, input, validation, required, submit, draft, wizard, amount, typing"],
  ["overlay", "modal, dialog, sheet, drawer, popover, dropdown, menu, tab, back, route, deep link"],
  ["layout", "layout, spacing, mobile, phone, responsive, breakpoint, card, page, scroll, overflow"],
  ["theme", "colour, color, dark mode, theme, contrast, token, font, typography"],
  ["motion", "animation, transition, motion, easing, hover effect, press, reduced motion"],
  ["diagram", "diagram, flowchart, architecture, sequence, state machine, swimlane, boxes and arrows"],
];

function readPacks() {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const text = fs.readFileSync(path.join(here, "..", "..", "kz-uiuxrule", "packs", "LOOKUP.md"), "utf8");
    const rows = [];
    for (const line of text.split("\n")) {
      const m = /^\| (.+?) \| \[(\w+)\]\(\w+\.md\) \|/.exec(line);
      if (m) { rows.push([m[2], m[1]]); }
    }
    return rows.length ? rows : FALLBACK_PACKS;
  } catch {
    return FALLBACK_PACKS;
  }
}

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

/* the words of the request, wherever the host put them */
function promptTextOf(payload) {
  const input = payload.tool_input || payload.input || payload.arguments || {};
  const parts = [payload.prompt, input.args, input.arguments, input.prompt, payload.args];
  return parts.filter((p) => typeof p === "string").join(" ").toLowerCase();
}

function shortName(name) {
  const clean = name.replace(/^\//, "").trim();
  /* a plugin-qualified or path-qualified name still matches its last segment */
  return clean.split(/[/:]/).pop();
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function recommendPack(text, packs) {
  if (!text) { return null; }
  let best = null;
  let bestHits = 0;
  for (const [name, keywords] of packs) {
    let hits = 0;
    for (const raw of keywords.split(",")) {
      const k = raw.trim().toLowerCase();
      if (!k) { continue; }
      const re = new RegExp("(^|[^a-z0-9])" + escapeRe(k) + "($|[^a-z0-9])");
      if (re.test(text)) { hits += 1; }
    }
    if (hits > bestHits) { best = name; bestHits = hits; }
  }
  return best;
}

/* true on the first kz call of this session; always true when the session cannot be told */
function firstCall(payload) {
  const id = payload.session_id || payload.sessionId || payload.conversation_id || "";
  if (typeof id !== "string" || !id) { return true; }
  const marker = path.join(os.tmpdir(), "kz-first-call-" + id.replace(/[^\w.-]/g, "_").slice(0, 120));
  try {
    fs.writeFileSync(marker, String(Date.now()), { flag: "wx" });
    return true;
  } catch (e) {
    return !(e && e.code === "EEXIST");
  }
}

function firstCallCard(skill, text) {
  const packs = readPacks();
  const rec = recommendPack(text, packs);
  const size = skill === "kz-fastfix" ? "trivial" : skill === "kz-crew021" ? "project" : "component";
  const types = packs.map(([n]) => (n === rec ? n + " (recommended)" : n)).join(" | ");
  const sizes = ["trivial", "component", "project"].map((s) => (s === size ? s + " (recommended)" : s)).join(" | ");
  return [
    "FIRST KZ CALL THIS SESSION: ask ONE Ask Card with these two lines before any work.",
    "  1. Type of work?  [ " + types + " | custom ]" + (rec ? "" : "  (mark the closest one recommended)"),
    "  2. Size?          [ " + sizes + " | custom ]",
    "Then read kz-uiuxrule/packs/LOOKUP.md and the one pack for that type, and run only that",
    "pack's checks on the screen the work is on (--hash, --tap, --wait); a run that reports",
    "WRONG SCREEN is a failure. Later kz calls this session reuse the answer and ask nothing.",
  ].join("\n");
}

function emit(payload) {
  const skill = shortName(skillNameOf(payload));
  if (!/^kz-/.test(skill)) { process.exit(0); }   /* every other skill passes through */

  const parts = [];
  if (firstCall(payload)) {
    let card = firstCallCard(skill, promptTextOf(payload));
    if (CARDS[skill]) { card += "\nPut both lines on the same card as the one below: one card per turn."; }
    parts.push(card);
  }
  if (CARDS[skill]) { parts.push(CARDS[skill]); }
  if (!parts.length) { process.exit(0); }
  const text = parts.join("\n\n");

  const claudeShaped = "hook_event_name" in payload || "tool_name" in payload;
  if (claudeShaped) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: payload.hook_event_name || "PreToolUse",
        additionalContext: text,
      },
    }));
  } else {
    process.stdout.write(text + "\n");
  }
  process.exit(0);
}

function safeEmit(payload) {
  try { emit(payload); } catch { process.exit(0); }   /* never block, never fail loudly */
}

/* an argument wins over stdin, so a host that passes JSON as argv works too */
const arg = process.argv[2];
if (arg) {
  let payload = {};
  try { payload = JSON.parse(arg); } catch { payload = { skill: arg }; }
  if (typeof payload !== "object" || payload === null) { payload = { skill: String(arg) }; }
  safeEmit(payload);
} else {
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => { raw += c; });
  process.stdin.on("end", () => {
    let payload = {};
    try { payload = JSON.parse(raw || "{}"); } catch { payload = {}; }
    if (typeof payload !== "object" || payload === null) { payload = {}; }
    safeEmit(payload);
  });
  /* no stdin at all (a host that just runs the command): say nothing rather than guess */
  setTimeout(() => { if (!raw) { process.exit(0); } }, 2000).unref?.();
}
