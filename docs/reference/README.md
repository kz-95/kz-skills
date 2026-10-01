# Reference page

`ui-rules-visual.html` is the live version of the rules: a wrong sample and a right sample for
each one, built from the same tokens and one shared table component. Open it in a browser.

Live: https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html

Two checks are bound to this page by element id and ship here, not in `kz-uicheck`, because on
any other page they would report clean and mean nothing:

- `rules-check.js` - asserts every wrong/right pair, including that each wrong sample still
  fails (a pair whose wrong half no longer fails teaches nothing).
- `state-check.js` - drives every table to 0, 1 and all rows, sorts every column, and checks
  chart, count, totals and legend still agree.

The three checks that work on **any** page are in `../../skills/kz-uicheck/checks/`.

To run them against this page, serve the folder (`python -m http.server` in `docs/`), open
`reference/ui-rules-visual.html`, and paste each file into the console one at a time, on a settled
page, at a wide width and at 375px.
