# Hero GIF

The README's opening animation (`docs/assets/hero.gif`), made with Remotion: a diagram drawn wrong, `diagram-check.js` naming each fault, the fixed diagram, then the title card. The story lives in `src/Hero.tsx`.

To re-render: `npm install`, then `CHROME=/path/to/chrome-headless-shell npm run render` (leave `CHROME` unset to let Remotion fetch its own), then copy `out/hero.gif` to `docs/assets/hero.gif`. Preview and edit with `npm run studio`.
