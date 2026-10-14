# kz-uicheck - running the checks, and the traps

Read this when a result looks wrong, when you serve the page and `fetch` the checks, or before
a full close-out. `../SKILL.md` has which check to run for what.

## Done condition for any page with a table

A page with a table is not done until `table-check.js` (and `popover-check.js` for its filter
panels) has been **run in a real browser and its output pasted into the report**. This includes
generated pages and static reports: a progress page, an export, a status board. They are UI, the
rules apply, and a copied older page is not evidence that the copy passes. A reviewer reads the
output, not the wording: a bare text box or select in the header satisfies the sentence "every
column has a filter" and fails the rule.

## One at a time, on a settled page

Run the checks one after another, never together, and not while the page is still moving: a
check started while another was scrolling the page reported fields "moved" by 26,000px, and a
colour read in the middle of a transition reported "none". Wait for the page to settle; switch
transitions off where a check reads a computed style. Colour checks run in **both** themes.

## Widths

The full close-out runs the layout audit at a wide width, a narrow one, and **375px with touch
emulation**. A scoped run uses one wide width and 375px. 375px is never optional: it is the only
width that exercises the 44px tap-target rule, and the width at which the typing check finds
anything at all - the defects it reports do not exist on a desktop.

## Instrument traps (read before trusting a result)

- **A hidden or unfocused tab** throttles `setTimeout` to about a second and never matches
  `:focus`. The async checks wait on a message channel instead, and `focus-check.js` refuses to
  run (and says why) unless the page has focus rather than reporting every control as unfocused.
- **Transitions** read mid-flight give colours that were never on screen. The checks that
  compare styles switch transitions off while they measure.
- **Synthetic events** cannot press a real Escape in a native `<dialog>`, trigger native hover,
  or submit implicitly. `modal-check.js` tests that nothing cancels the cancel event instead.

## Check the instrument before you believe it

A viewport of zero width, or a surface that never painted a frame, produces confident and wrong
numbers. If a check returns clean on a page you have not seen render, the check is what is
broken. `../../kz-uiuxrule/rules/ui-rules.md` Appendix Z has this one written up with the
examples, along with the green check that asserts the wrong thing.

## Serving the page and fetching the checks: bust the cache

They work pasted straight into the console. If you serve the page instead and `fetch` them,
**bust the cache** - without it the browser serves the copy it already has, so an edited check
reports on the version before your edit and says everything is fine:

```js
await (async () => eval(await (await fetch('layout-audit.js?t=' + Date.now(), { cache: 'no-store' })).text()))()
```

That is not a footnote. It cost a full round on the project these came from: 43 findings that
had already been fixed.

## What is deliberately not here

Two more checks exist in the project these rules came from - a rules check that asserts the
wrong/right sample pairs, and a state check that drives every table to 0, 1 and all rows. Both
are bound to that project's own page by element id, so they would return clean and meaningless
anywhere else. The pattern is worth copying; the files are not portable, so they are not
shipped pretending to be.
