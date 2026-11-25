# kz-uicheck - running the checks, and the traps

Read this when a result looks wrong, when you serve the page and `fetch` the checks, or before
a full close-out. `../SKILL.md` has which check to run for what. The fast lanes (`kz-fastfix`,
`kz-flashrule`) do not need this page: they run one check with `run-checks.py --checks`.

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

## Point the check at the screen you changed

A check measures whatever is on screen after load, which is usually the first tab.
If the work is on a second tab, a sheet or a gated view, a clean result says nothing about it.
`run-checks.py` takes the route to that screen:

```
python run-checks.py app.html --hash orders --storage state.json --tap "#tab-open,#new-order" --wait ".sheet" --expect "New order"
```

- `--hash ROUTE` opens `app.html#ROUTE`.
- `--storage FILE` writes a JSON object of keys to localStorage before any page script runs; a value that is not a string is stored as JSON.
- `--tap SELECTORS` clicks each selector in order after load, about 150ms apart; each target must be visible, as it would have to be for a person.
- `--wait SELECTOR` must exist and be visible before the check runs.
- `--expect TEXT` must be visible text on the page before the check runs.

If a tap target is missing or hidden, or the wait or the text never shows within about 3s, the run fails with `WRONG SCREEN: ...` and exits 1.
A check that saw the wrong screen counts as failed, never as clean.
The header line names the screen used, so the report shows what was measured.

## Widths

The full close-out runs the layout audit at a wide width, a narrow one, and **375px with touch
emulation**. A scoped run uses 375px alone. 375px is never optional: it is the only
width that exercises the 44px tap-target rule, and the width at which the typing check finds
anything at all - the defects it reports do not exist on a desktop.

`run-checks.py` emulates the pointer to match: a mouse that hovers above 480px, touch at 480px and below.
Pass `--pointer fine` or `--pointer touch` to choose.
Without emulation headless Chrome reports no pointer at all, so a hover tooltip could never be tested and a phone's tap targets never measured.

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
