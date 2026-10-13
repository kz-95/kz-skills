# Hero GIF

The README's opening animation (`docs/assets/hero.gif`), made with Remotion. The plan it follows is `PLAN.md`.

- `src/scenes/Poster.tsx`: frame 0 and the loop seam.
- `src/scenes/TablesT1.tsx`: rule T1; a bare text box per column, `table-check.js` reports BOX, the filter becomes a panel and the check passes.
- `src/scenes/ContrastY2.tsx`: rule Y2 in the dark theme; a label at 1.05:1, `contrast-check.js` (both themes) reports LOW, the label takes the dark token.
- `src/scenes/ChartsC5.tsx`: rule C5; a wedge's focus ring is its bounding box, `layout-audit.js` reports FOCUS BOX, the ring follows the wedge.
- `src/scenes/DiagramsG6.tsx`: rule G6; a plate on its line, `diagram-check.js` reports LABEL ON LINE, the plate moves 6px clear.
- `src/scenes/Close.tsx`: the closing card, dissolving into the poster.
- `src/Frame.tsx`: the shared top bar, stage, console and footer. `src/Hero.tsx` strings the scenes together; `src/Root.tsx` also registers each scene on its own under "Scenes".
- `src/parts/G6Parts.tsx`: diagram drawing kept from the first hero for the Diagrams scene.
- `public/`: Inter and JetBrains Mono (woff2, from @fontsource 5.2.8) and their OFL licences, so a render does not depend on installed fonts.

## Console strings

Each is the real output of the check on a wrong and a right sample page (small HTML pages built to match the scene, run in Chromium with Playwright), cut at a word boundary and ending in "...", never reworded:

| Scene | Check | Finding (wrong page) | Clean (right page) |
|---|---|---|---|
| T1 | table-check.js | `BOX \| table 1 \| 3 of 3 column filters are a bare text box...` | `table check: 1 table(s) read - no failures` |
| Y2 | contrast-check.js | `LOW \| dark: span.label \| 1.05:1, needs 4.5:1...` | `contrast check: clean - 6 text runs read in both themes` |
| C5 | layout-audit.js | `FOCUS BOX \| wedge \| 3 x path.wedge: the focus ring is the bounding box...` | `clean` |
| G6 | diagram-check.js | `LABEL ON LINE \| svg "Checkout" \| plate "WRITE" covers its own line...` | `diagram check: clean - 1 diagram(s) measured` |

If a check's wording changes, rebuild the sample pages, re-run the check and update the strings in `src/Hero.tsx` and `src/Root.tsx`.

To render: `npm ci`, then `CHROME=/path/to/chrome-headless-shell npm run render` (leave `CHROME` unset to let Remotion fetch its own). It writes `out/hero.gif` and copies it to `docs/assets/hero.gif`. The GIF encoder settings are pinned in `remotion.config.ts`. Stills for review: `npm run stills -- 0,144,190,270`. Preview with `npm run studio`.
