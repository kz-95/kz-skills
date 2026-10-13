# Hero GIF plan (v3, agreed)

v3 is v2 plus the seven conditions below, agreed by the planner and the reviewer. v2 adopts the reviewer's required changes 1-15 except where noted under "Deviations", which state why.

## Purpose
The top of the kz-skills README. The title and bold line above the GIF already say what the repo is; the GIF's own job is to show the mechanism: a rule, the failure, a real check catching it, the fix passing. Breadth comes from the poster, the category scenes and the closing card.

## Viewing conditions
- Desktop README column about 830px: scale about 0.69 of 1200. Mobile about 350px: scale about 0.29.
- GitHub shows frame 0 paused (with a play button) to users whose OS asks for reduced motion. Frame 0 is therefore a designed poster, never blank.
- Autoplays, loops forever (NETSCAPE loop count 0), no pause.

## Canvas, timing, encoding
- 1200x675 (16:9; about 37px more height on mobile than 2:1).
- Composition 30 fps, rendered with --every-nth-frame=2 (15 fps, 7 cs per frame in the file). Real duration = frames x 70 ms, measured from the file.
- Encoder pinned via Config.overrideFfmpegCommand in remotion.config.ts: palettegen=stats_mode=diff, paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle; compare against dither=none and keep the smaller, cleaner one. Target under 2.5MB; fallback drop to 10 fps (10 cs exact), never shrink the canvas.
- No full-frame UI-to-UI crossfades: scenes fade to the background (or the poster), then in. No blinking caret. No full-frame luminance change faster than 0.4 s (the dark Contrast scene fades in over 0.5 s).
- Fonts bundled: Inter and JetBrains Mono woff2 in scripts/hero/public/ with their OFL licence files, loaded with @remotion/fonts loadFont. Rendering does not depend on installed fonts.

## Layout (category scenes)
- Outer margin 48px.
- Top bar y 24-92: category name left; rule ID + rule in a few words right (32px bold); WRONG / RIGHT chip (32px bold, solid colour block) at the right end.
- Stage y 104-452: the sample UI as vector React components (no screenshots).
- Console y 464-620, full width (about 1100px, about 70 monospace characters at 24px), labelled "browser console", prompt "> ". Three lines max: command, finding (stays, dimmed after the fix), clean line.
- Footer y 632-660: a small "kz-skills" mark left, progress chips right (Tables, Contrast, Charts, Diagrams), current one filled.

## Type scale
Poster/opening/closing headline 64px, supporting 44px; top-bar rule text and chips 32px bold; console 24px; nothing that carries meaning below 22px. This deviates from remotion-create/video-layout.md's 84/44 minimum because this is a README image at a known ~830px column with no overscan; 64px renders about 44px on desktop and 19px on mobile.

## Storyboard (about 28 s of composition; measured in file after render)

| Time | Scene | Content |
|---|---|---|
| 0.0-3.0 | Poster (frame 0 = first frame of this hold) | "kz-skills" / "UI rules for AI coding agents, each with a browser check that measures it." / category chips: Tables, Contrast, Charts, Diagrams |
| 3.0-8.5 | Tables T1 | 5.5 s beats below |
| 8.5-14.0 | Contrast Y2 (dark theme) | |
| 14.0-19.5 | Charts C5 | |
| 19.5-25.0 | Diagrams G6 | |
| 25.0-28.0 | Close, then fade to the poster | "94 rules. 10 checks. Any stack." / "npx skills add kz-95/kz-skills" ; the last frames dissolve into the poster so the loop seam is the poster hold |

Beats per 5.5 s category scene:

| Time | Beat |
|---|---|
| 0.0-0.4 | Fade in from background |
| 0.4-1.5 | Wrong sample held, WRONG chip, top-bar rule readable |
| 1.5-2.0 | Command typed (no caret blink) |
| 2.0-3.6 | Finding line + magenta outline and tag on the element, held |
| 3.6-4.2 | Morph, Easing.spring damping 200, no overshoot |
| 4.2-5.5 | Clean line, RIGHT chip; finding stays dimmed above it |

## Scene content, with the checks' real wording (verified against each check's header and log calls)
- Tables, T1 "A column filter is a panel, not a single input." Check table-check.js. Finding `BOX | table | a bare text box is the column filter`. Clean `table check: 1 table(s) read - no failures`. Right sample: sortable headers, a filter button on every column, title and filter rows as one header block, a search box and a "2 of 4" count, and one open panel (value list with counts, applies live, no OK/Cancel).
- Contrast, Y2 "Text over a variable background needs a contrast decision." Check contrast-check.js. Finding `LOW | span.label | 1.04:1, needs 4.5:1`. Clean `contrast check: clean - N text runs read in both themes`. Wrong: a dark-theme card with a label dark-on-dark; right: the label on a plate / correct token, measured ratio shown.
- Charts, C5 "A focus ring follows the mark, never a box round it." Check layout-audit.js. Finding `FOCUS BOX | path.wedge | the focus ring is the bounding box, a rectangle round the shape`. Clean `clean`.
- Diagrams, G6 "A label sits beside its line, clear of it." Check diagram-check.js. Finding `LABEL ON LINE | svg "Checkout" | plate "WRITE" covers its own line`. Clean `diagram check: clean - 1 diagram(s) measured`. Right sample has a gap of at least 6px.
Exact strings are confirmed by building each wrong and right sample as an HTML page and running the real check on it; the console shows that output, trimmed only where a selector is long.

## Reading time
Every text element is on screen at least 0.5 s + 0.3 s per word, minimum 1.5 s. A table of every string, word count, frames on screen and frames required is produced and must all pass. Poster line 2 is 12 words (needs 4.1 s): it is visible for the 3 s poster hold plus the close fade-in, and, because the poster is also frame 0 and the loop seam, a paused or looping viewer sees it longest; if the table fails, the poster hold grows to 4 s.

## Remotion structure
- One file per scene in src/scenes/, each also registered as a connected composition inside <Folder name="Scenes"> in Root.tsx; the Hero composition is a <TransitionSeries> with inline name and durationInFrames per sequence and premountFor={fps}; timings as n * fps from useVideoConfig(); interpolate inline in style; translate/scale properties; Interactive.withSchema where the skill asks for it.
- Reuse Hero.tsx's Diagram, Tag and toPath code for the G6 scene, cut down to the single label fault; the rest of the old scene is replaced.

## Render and review
- `npm run render`: entry point, ${CHROME:+--browser-executable=$CHROME}, GIF out, copy to docs/assets/hero.gif; no loop-count flag (loops forever). README in scripts/hero updated.
- Stills for review: `npx remotion render src/index.ts Hero out/frames --frames=<list> --image-format=png` for frame 0, the last frame, and 3 per scene (wrong held, finding, clean). Contact sheet viewed at 830px and 350px wide.

## Acceptance
1. Frame 0 alone explains the repo.
2. Reading-time table passes against the delays in the file.
3. Each console line fits on one line; each right sample passes its real check and each wrong sample produces exactly the shown finding.
4. Every non-sample text pair is at least 4.5:1 (table of pairs and ratios; magenta tag #c2185b on white text about 5.8:1; chips checked).
5. Under 2.5MB, loop count 0, no visible seam, no dither noise at 200% on flat areas.
6. Counts in the close match the README ("94 rules", "10 checks") by grep.
7. README alt text: one sentence per scene (category, rule ID, what the check reported, fixed and clean) plus the closing line; the image links to https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html.
8. docs/README.md and CHANGELOG mention the new hero.

## Deviations from the review, with reasons
- Four categories, not three: the owner asked for "a few different categories", and Diagrams is the newest rule set this release adds. Forms is dropped, as the review advised; Contrast replaces it.
- No live Studio review by the owner: the owner cannot reach this container's Studio. The contact sheet of stills is sent to the owner instead, before the GIF is accepted.
- No <picture> reduced-motion source: GitHub's sanitizer keeps prefers-color-scheme sources but there is no evidence it honours prefers-reduced-motion in README <picture>; the poster frame 0 covers that case instead.

## Conditions added in v3 (agreed; these override anything above)
1. Console lines are the checks' real output, cut at a word boundary and ending in "...", never reworded. Test: each console string is a prefix of the real check's output on the sample page.
2. The Contrast sample page switches themes with [data-theme] CSS so contrast-check.js runs both themes; its finding reads "LOW | dark: span.label | 1.04:1, needs 4.5:1" and its clean line ends "in both themes". Test: real output contains "dark:" and "in both themes".
3. Y2 top bar uses Y2's own wording, e.g. "Y2  The pass mark is a number, in both themes."
4. Scenes are 6.0 s: finding by 1.8 s, morph 3.6-4.2 s, clean from 4.2 s, fade-out 5.7-6.0 s (total about 30 s composition, about 31.5 s in the file). "On screen" counts only frames at opacity >= 0.9; console words are counted without "|"; clean lines need >= 1.5 s; every finding line has at most (seconds visible - 0.5) / 0.3 words.
5. Margins: 48px at the sides, at least 24px top and bottom; the footer ends at y 651 or above; footer chip labels >= 22px. Test on the contact-sheet stills.
6. @remotion/transitions and @remotion/fonts added with `npx remotion add`, pinned to 4.0.535 like remotion. Test: npm ci then npm run render works from a clean checkout.
7. The longest console line at 24px JetBrains Mono fits the console card's inner width without wrapping; if not, cut it at a word boundary (selector trimmed), never shrink the font.
Optional, adopted: send the owner a first contact sheet of the poster and the Tables scene before building the other three.
