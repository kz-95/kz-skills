---
name: kz-uicheck
description: Eight runnable browser checks that measure an interface instead of judging it: layout audit (overflow, overlap, clipped text, tap targets, SVG focus ring, undefined CSS variable), table check (text-box filters, missing filter or sort, header spacing), typing check (field rebuilt, caret-jumped or zoomed while typed), popover check (a panel that cannot be closed), contrast check (under 4.5:1 on the real background, both themes), modal check (scroll lock, focus, backdrop, Escape), focus check (every control shows focus) and form check (labels, types, nudge, submit). Paste into the console; no build step, no framework. Use before calling UI work done and once at phone width. Triggers on "/kz-uicheck", "check this page", "layout audit", "table check", "contrast check", "modal check", "focus check", "form check", "verify the UI".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-uicheck

The instruments behind `kz-uiuxrule`'s V rules. A rule with no check is a rule that gets
broken by the person who wrote it, and the V category says to measure rather than assert.
These are what does the measuring.

All of them are plain ES5 in an IIFE. Paste one into the browser console on the page you
are checking. Nothing to install, no selectors to configure, no framework assumed.

| Check | Catches | Rule |
|---|---|---|
| `checks/layout-audit.js` | Horizontal page overflow, overlapping boxes, clipped text, ragged control rows, tap targets under 44px, SVG text outside its viewBox or landing on other text, a focus ring on an SVG shape that is a bounding box instead of the shape (`FOCUS BOX`), a `var(--x)` that nothing defines so its whole declaration silently drops (`UNDEFINED TOKEN`) | `V3`, `L5` |
| `checks/table-check.js` | A column filter that is a bare text box or select instead of a panel, a column with no filter, a table with no sort, a header whose title and filter rows are split by a line or whose filter sits under 4px from one (`FILTERGAP`, measured in px); and, as advisories, no search, no live count, headers with no explainer. Skip a deliberately wrong sample with `data-table-check="skip"` | `S1`, `T1`-`T3` |
| `checks/typing-check.js` | A field rebuilt mid-word (the phone keyboard closes), a caret thrown to the end, a field that moves while typed into, text under 16px that makes the browser zoom on focus | `F8` |
| `checks/popover-check.js` | A dropdown or panel that cannot be closed: its trigger only opens (`STUCK`), Escape or an outside click does nothing, no visible Done on touch | `N2` |
| `checks/contrast-check.js` | Text under 4.5:1 (3:1 large) against the background it really sits on, translucent layers and ancestor opacity composited, both themes; gradient backgrounds reported as `UNKNOWN`, never guessed | `Y2` |
| `checks/modal-check.js` | A modal that leaves the page scrolling (`SCROLL`), shifts it sideways (`SHIFT`), does not take focus, lets clicks through to the page behind (`BACKDROP`), cancels Escape, or does not return focus to its opener | `N1` |
| `checks/focus-check.js` | A control whose focus changes nothing visible (`NOFOCUS`), a focus indicator under 3:1 (`WEAK`), `tabindex` above 0, a clickable thing the keyboard cannot reach. Needs the page focused | `A` |
| `checks/form-check.js` | A field with no label, a phone or email field typed as text, an error shown while typing, a required field left with no nudge, a refused submit that does not land in the first empty field. Types into the page: reload after | `F1` `F2` |

## Instrument traps (read before trusting a result)

- **A hidden or unfocused tab** throttles `setTimeout` to about a second and never matches `:focus`. The
  async checks wait on a message channel instead, and `focus-check.js` refuses to run (and says why)
  unless the page has focus rather than reporting every control as unfocused.
- **Transitions** read mid-flight give colours that were never on screen. The checks that compare styles
  switch transitions off while they measure.
- **Synthetic events** cannot press a real Escape in a native `<dialog>`, trigger native hover, or submit
  implicitly. `modal-check.js` tests that nothing cancels the cancel event instead.

## How to run them

They work pasted straight into the console. If you serve the page instead and `fetch`
them, **bust the cache** - without it the browser serves the copy it already has, so an
edited check reports on the version before your edit and says everything is fine:

```js
await (async () => eval(await (await fetch('layout-audit.js?t=' + Date.now(), { cache: 'no-store' })).text()))()
```

That is not a footnote. It cost a full round on the project these came from: 43 findings
that had already been fixed.

## One at a time, on a settled page

Run the checks one after another, never together, and not while the page is still moving: a
check started while another was scrolling the page reported fields "moved" by 26,000px, and a
colour read in the middle of a transition reported "none". Wait for the page to settle; switch
transitions off where a check reads a computed style. Run colour checks in **both** themes.

## Three widths, and one of them is not optional

Run the layout audit at a wide width, a narrow one, and **375px with touch emulation**.
The third is the only one that exercises the 44px tap-target rule, and it is the width at
which the typing check finds anything at all - the defects it reports do not exist on a
desktop.

## Check the instrument before you believe it

A viewport of zero width, or a surface that never painted a frame, produces confident and
wrong numbers. If a check returns clean on a page you have not seen render, the check is
what is broken. `../kz-uiuxrule/rules/ui-rules.md` Appendix Z has this one written up with
the examples, along with the green check that asserts the wrong thing.

## What is deliberately not here

Two more checks exist in the project these rules came from - a rules check that asserts
the wrong/right sample pairs, and a state check that drives every table to 0, 1 and all
rows. Both are bound to that project's own page by element id, so they would return clean
and meaningless anywhere else. The pattern is worth copying; the files are not portable,
so they are not shipped pretending to be.
