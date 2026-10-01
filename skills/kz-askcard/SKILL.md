---
name: kz-askcard
description: The one-card rule for asking a user anything - three to five decisions that change the output, one marked recommended with four words of why, a custom option always open, and a stated default for every line so silence is still progress. Never two cards in one turn, never a trickle of questions, never a question the repo already answers. Use before asking a user for direction at the start of any run, and when a subagent hits a question mid-build. Triggers on "/kz-askcard", "ask card", "what should I ask the user".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-askcard

One card, asked once, carrying only decisions that change what gets done. Never a
conversation. The user answers a card and the work proceeds.

This is shared doctrine: `kz-crew021` and `kz-uiuxrule` both open with a card, and
`hooks/ui-rule-purpose.mjs` serves one for either of them before the skill runs. The
formats differ because the outputs differ. The rules below do not.

## The six rules

1. **Look before you ask.** Anything the repo answers, the repo answers. A card that
   asks what a `.pb/` directory, a `docs/` folder or the request itself already says
   wastes the user's turn. Say in one line what you read, then ask only the remainder.
2. **Three to five decisions, never more**, and every one must change the output. Fewer
   means the asking step under-asked; more means it is dumping its job on the user.
3. **One option per question is marked `(recommended)`**, with four words of why - the
   one you would pick having read the repo. A card with no recommendation hands the
   thinking back to the user, which is the opposite of the job.
4. **A custom option is always open.** Someone whose answer is not on the card must be
   able to say so, rather than picking a wrong option to get moving - and the wrong pick
   is what then gets built for an hour.
5. **State the default for every line**, so silence is still progress. Anything the card
   cannot settle is assumed, tagged `ASSUMED`, and carried on with. A build that stalls
   on a question is a defect.
6. **One card per turn.** Two cards in one turn is one too many. Where two skills would
   each raise one - a crew run that ships UI - they are the same instrument, and the
   second skill's decisions become lines on the card already going out.

## Two formats

**Decision-ledger** (`kz-crew021`) - each answer becomes a `D-id` recorded in
`Decisions.md`, and every task depending on that id is re-queued if it changes:

```
## Ask Card - <project>

### Unresolved scope
- <the items the relay could not settle, one line each, with both positions>

### Blocking decisions (3-5)
D-001 - <question>
        A) <option> - <consequence>
        B) <option> - <consequence>
        recommendation: <one>
```

**Inline** (`kz-uiuxrule`) - no ledger, the answers apply to this run only:

```
ASK CARD - <mode>
Found:    <what is already in the project, in one line>
Decide:
  1. <decision>   [ option A (recommended - <four words why>) | option B | custom ]
  2. <decision>   [ ... ]
Assumed if you do not answer: <the default for each>
```

Use the host's question UI where there is one. Otherwise print the card and stop for an
answer.

## The hook

`hooks/ui-rule-purpose.mjs` enforces rule 1 and rule 6 outside the document, on any host
that can run a command before a skill call and feed its stdout back to the model - most
agent runners, not just Claude Code. It carries a card per skill, fires only for the
skills it knows, and never blocks. Wiring, and what has actually been tested, is in
`hooks/README.md`.

```bash
echo '{"skill":"kz-uiuxrule"}' | node hooks/ui-rule-purpose.mjs
```

Where no hook is wired, this document is the requirement.
