# Diagram Rules

Rules for a drawn diagram: boxes, the lines between them, the labels on those lines, and
the figure they make together - an architecture, a flow, a sequence, a state machine, a
data model, a swimlane. `G1-G10`, and the numbers they point at.

A chart plots values on scales and has its own rules in [chart-rules.md](chart-rules.md);
a diagram shows things and how they connect. Where a figure does both - a sankey, a funnel
with counts - the chart rules hold for the values and these rules hold for the lines.

This file is complete on its own, so diagram work can read it without the rest of the
corpus. It still sits **on top of** [engineering-rules.md](../../kz-engrules/rules/engineering-rules.md)
and [ui-rules.md](ui-rules.md), never instead of them. Where a diagram touches another rule,
that rule is cited by ID: never colour alone is `C7`, every mark explained is `C11`,
contrast is `Y2`, a row that scrolls sideways is `L11`, motion is `M1`.

The same order of precedence as every rule file applies: the task's explicit instruction,
then the project's own rules, then consistent existing code, then this file. **These rules
say nothing about the look** - typeface, palette, corner radius, a hand-drawn stroke. A
style skill or the project's design system decides those (`D4`). What is fixed is what the
reader must be able to do: find the point, follow every line, read every label, on any
screen.

The live samples are in `ui-rules-visual.html`, section G. The check is
[`diagram-check.js`](../../kz-uicheck/checks/diagram-check.js) in `kz-uicheck`, which
measures the drawn page - lines, plates and boxes in screen pixels after CSS, transforms and
font fallback - so it sees what a parser of the file cannot.

Several of these rules, and the appendix numbers, are adapted from the connector rules and
complexity budget of [diagram-design](https://github.com/cathrynlavery/diagram-design) by
Cathryn Lavery (MIT). The checks and the browser measurement are this corpus's own.

---

## The rules

| # | Rule |
|---|---|
| G1 | **A diagram earns its place, and its form comes from what the reader must understand.** Before drawing, ask whether a sentence or a table says the same thing; if it does, write that instead. A list of things is a table, an attribute-by-attribute before and after is a table, a single box is a sentence. Choose the form from the question - what flows, what waits, what is allowed, what changes - and only then the layout (`C1` is the same rule for charts). The failure: a diagram that restates a list costs the reader a picture to decode and teaches nothing a line of text would not. Check: `diagram-check.js` `TRIVIAL` (advisory: two boxes or fewer and one line), and by hand, the paragraph test. |
| G2 | **One diagram holds at most nine boxes, twelve lines and two emphasised things; past that it splits.** A board of cards with no arrows between them - a kanban, a story map - may hold twelve. Over budget, cut in the fixed order in the appendix and say what was cut - or split into an overview and one detail diagram per part. Never shrink it to fit. The failure: a dense diagram is not read, it is searched, and the reader cannot find the point among twenty boxes of equal weight. Check: `diagram-check.js` `BUDGET`. |
| G3 | **Lines between boxes run horizontally and vertically, and meet a box square to its edge.** A bend is a rounded corner; a straight line is used only when both ends share an x or a y. Each line enters and leaves perpendicular to the edge it touches, at least 8px from a corner. The failure: slanted lines cross each other at angles the eye cannot follow, and a line that starts at a rounded corner points at nothing, so the reader cannot tell which box it leaves. Check: `diagram-check.js` `DIAGONAL` and `CORNER`. |
| G4 | **Every line can be traced on its own from end to end.** No two lines share a stroke or run on top of each other: parallel routes stay 12px or more apart, and a single crossing gets a hop. Lines meeting one edge of a box each get their own point on it, spread evenly and 12px or more apart (8px on a small box). The failure: two lines drawn as one carry two relationships and show one, and a fan of lines into one point cannot be told apart at the box, which is where the reader looks. Check: `diagram-check.js` `STACKED` and `SHARED PORT`. |
| G5 | **A line never passes behind a box that is not one of its ends.** Route around it. Only where the box is geometrically unavoidable - a full-width bar between the two ends - does the line cross it, and then it is dashed, carries its label at the visible end, and has no arrowhead on the box it passes. The failure: a line disappearing into a box reads as that box being part of the path. Check: `diagram-check.js` `BEHIND BOX`. |
| G6 | **A label sits beside its line, on an opaque plate, clear of the line and of every box.** The plate is a solid fill so the line does not show through the text; between the plate and the line there is a visible gap, never under 4px and best at 6 to 10px; beside a vertical line the label goes to the side. A plate is never partly under a box drawn after it. Short labels, one orientation (`C21`). The failure: a label on its line hides the line it names, so the reader cannot see where the connection goes, and a plate half under a box shows a fragment of a word. Check: `diagram-check.js` `LABEL ON LINE`, `LABEL GAP` and `PLATE UNDER BOX`. |
| G7 | **Every kind of mark is explained, in a key below the drawing.** Each box treatment, line style and badge used has one entry; nothing in the key is unused. The key is a strip under the diagram, never floating inside it. This is `C11` for diagrams. The failure: a key inside the drawing collides with the boxes as soon as the diagram grows, and an unexplained dashed line is read as decoration or as an error. Check: `diagram-check.js` `KEY INSIDE` for a key marked `data-diagram="key"` or with a class or id containing `legend` or `key`; by hand, each style in the drawing has an entry. |
| G8 | **A wide diagram keeps its size on a narrow screen, scrolls inside its own box, and says so.** Its minimum width equals its native width (the `viewBox` width), inside a container that scrolls sideways, and that container sits inside anything that clips. While the drawing is wider than its box, a visible cue says more is to the side, as `L11` asks of a row: a scrollbar that can be seen (6px or thicker, its thumb 3:1 against what it sits on), a shadow on each edge that has more, and a short line under it such as "Scroll sideways to see all of it", shown only while it overflows. Overlay scrollbars on phones and Macs show nothing until touched, so the shadow and the line carry the cue there. In print, all of it is released so the drawing scales to the page. The failure: a diagram allowed to shrink takes its text with it - a 12px label on a 1280-wide drawing squeezed into a phone is under 4px - and a diagram inside a clipping card loses its right side with no scrollbar, which a page-overflow check reports as clean. A diagram that scrolls with no cue stops at the card's edge with lines running to boxes that are not there, so it reads as broken, or as all there is. Check: `diagram-check.js` `SHRUNK`, `PAGE SCROLL`, `CLIPPED` and `NO CUE`, at a wide width and at 375px. |
| G9 | **A diagram is a named figure.** The `<svg>` carries `role="img"` and `aria-labelledby` naming a `<title>` (its first child, the subject in 60 characters or fewer) and a `<desc>` (one sentence on what it shows, not on its shapes). Their ids are unique on the page. Decorative glyphs carry `aria-hidden="true"` instead. The failure: a screen reader announces "image" and nothing else, and with two diagrams sharing a `title` id, the second is announced with the first one's name. Check: `diagram-check.js` `NO NAME` and `DUP ID`. |
| G10 | **Emphasis goes on one or two things, and meaning never rides on colour or motion alone.** The accent marks the point of the diagram; on five boxes it marks nothing. States and outcomes are words on the drawing, so a still frame and a greyscale print both carry the full meaning (`C7`, `M1`). The failure: emphasis on everything is emphasis on nothing, and a diagram whose "failed" path is only red says nothing to a reader who cannot see red. Check: `diagram-check.js` `EMPHASIS` (more than two boxes stroked in a colour the rest do not use). |

**Order of the rules:** G1 and G2 decide whether to draw and how much, G3 to G6 how the
lines and labels sit, G7 to G10 what makes it readable by every reader on every screen.

---

## Appendix: the numbers (rules G2-G8)

A rule that says "clear" or "not too dense" is a judgement the next person makes
differently. These are the figures behind them, and the reason for each.

### Budget per diagram

| Limit | Value | Why this, not more |
|---|---|---|
| Boxes | 9 | Past nine, the eye stops reading the diagram as one picture and starts scanning it as a list |
| Cards with no arrows between them | 12 | With no lines to follow, a board is read row by row, and twelve still fits one glance per row |
| Lines | 12 | Twelve orthogonal lines can be routed among nine boxes without crossings that need hops everywhere |
| Emphasised things | 2 | One point and, at most, the thing it depends on |
| Callouts (a note with a leader) | 2 | A third callout is a paragraph that belongs under the figure |
| Lifelines (a sequence) | 5 | Wider and the messages become too short to label |
| Lanes (a swimlane) | 5 | Each extra lane halves the room for the boxes in the others |
| Nesting depth (a tree, nested boxes) | 4 | Deeper and the leaves are too small to label at the root's scale |

A type with its own natural limit uses the stricter of the two. A source with more than the
budget - an import, a full inventory - may keep up to 24 boxes only if every box sits in one of
two to four labelled zones; past 24 it splits, always.

### When over budget: cut in this order

Stop as soon as the diagram is under budget. Never cut ad hoc, and report every cut after
step 1 under the figure, because the person who knows the system will notice what is
missing and stop trusting the rest.

1. **Decoration** - free-floating notes, title blocks, the source's own legend.
2. **Exact duplicates** - N identical workers, replicas or shards become one box,
   `Worker x N`.
3. **Leaf groups** - a container whose children are all leaves becomes the container.
4. **Dead ends that do not change the story** - a monitoring hook, a log bucket, an archive.
5. **Shared infrastructure** - logging, metrics, secrets, CI. Keep one only if the diagram
   is about it.
6. **Still over:** split into an overview (each part as one box) and one detail diagram per
   part. Splitting beats shrinking.

### Lines and labels

| Measure | Value | Why |
|---|---|---|
| Bend radius | 8px (6px at the least) | Large enough to read as a turn, small enough not to look like a curve |
| Port distance from a corner | 8px or more | Inside that, a rounded corner makes it unclear which edge the line leaves |
| Parallel lines apart | 12px or more | Below about 10px two 1px lines merge at normal reading distance |
| Ports on one edge | at `L x k / (N + 1)` for line k of N | Even spacing, so no port sits on a corner and no two touch |
| Plate to line gap | 6 to 10px, never under 4px | Under 4px the plate reads as sitting on the line; past 10px it detaches from the line it names |
| Label length | 14 characters or fewer | Longer belongs in a callout or the text around the figure |
| Text width budget | 0.60em per character, sans or mono | Sizing a plate from a guessed 0.47em clipped labels twice when the font fell back; 0.60em fits the common fallbacks |

**Why draw lines before boxes:** the paint order decides what covers what. Lines first, then
label plates, then boxes means a box always covers the end of a line cleanly, and a plate
that strays into a box is covered and visibly broken - which is why G6 forbids it, and why
`diagram-check.js` reads the paint order rather than guessing.

### Holding the canvas on a phone

```html
<div class="diagram-scroll">
  <svg viewBox="0 0 960 600" role="img" aria-labelledby="flow-title flow-desc">...</svg>
</div>
```

```css
.diagram-scroll { width: 100%; overflow-x: auto; }
.diagram-scroll svg { width: 100%; min-width: 960px; display: block; } /* = viewBox width */
@media print { .diagram-scroll { overflow-x: visible; } .diagram-scroll svg { min-width: 0; } }
```

Two shapes need care. A centred grid or flex item sizes itself to the drawing, so the
scroller never scrolls: give that item `max-width: 100%; min-width: 0`. And when an ancestor
clips (`overflow: hidden` - a card, a window frame), the scroller must sit **inside** it, or
the drawing is cut off with no scrollbar at all. The print rule comes after the screen rule,
because a media query adds no specificity.

A scroller that hides its scrollbar, or carries the page's thin low-contrast one, needs its cue
drawn. One way, with no script for the shadows - the two `local` covers scroll with the drawing
and hide each shadow once its side is reached:

```css
.diagram-scroll {
  scrollbar-width: auto; scrollbar-color: var(--muted) var(--surface-2);
  background:
    linear-gradient(to right, var(--surface) 50%, transparent) left center / 48px 200% no-repeat local,
    linear-gradient(to left, var(--surface) 50%, transparent) right center / 48px 200% no-repeat local,
    linear-gradient(to right, color-mix(in srgb, var(--muted) 35%, transparent), transparent) left center / 20px calc(100% - 2px) no-repeat scroll,
    linear-gradient(to left, color-mix(in srgb, var(--muted) 35%, transparent), transparent) right center / 20px calc(100% - 2px) no-repeat scroll,
    var(--surface);
}
```

```html
<p data-diagram="cue" hidden>Scroll sideways to see all of it</p>  <!-- right after the scroller -->
```

and three lines of script that set `hidden` to `!(scroller.scrollWidth > scroller.clientWidth)` on
load and on resize. The shadows sit behind the drawing, so where a box is cut at the edge the cut
box is the cue; between boxes the shadow is. Use the page's own surface tokens: a cover that does
not match the card shows as a pale block.

**Why say it scrolls:** a reader who sees a drawing stop at the edge of its card has no reason to
think it goes on, and a lone arrow pointing off the edge reads as an error. A scrollbar alone is
not enough - on a phone or a Mac it is invisible until touched.

**Why not let it shrink:** a phone reader can scroll a drawing sideways; nobody can read 4px
text. Fitting the width by shrinking trades a gesture the reader knows for a figure no one
can read. The same trade is `L11` for rows of cards.

---

## Why this, not that

- **Why horizontal and vertical lines, not the shortest line.** The shortest line between
  two boxes is straight and slanted, and three of them make a web the eye cannot sort. Lines
  on two axes form a grid the reader follows like a street map: every turn is a decision
  point you can see.
- **Why a gap between a label and its line, not a label on the line.** A plate on the line
  cuts the line in two, and the reader has to guess that the two halves are one connection.
  With a gap, the line stays whole and the label sits next to the thing it names.
- **Why route around a box, not through it.** A line that enters a box is read as entering
  it. Passing behind costs nothing to draw and changes what the diagram says.
- **Why a key under the figure, not inside it.** Inside, the key competes with the boxes for
  space and attention, and it is the first thing to collide when a box is added. Under it,
  the key is found where captions are always found.
- **Why split, not shrink.** A shrunk diagram keeps every box and loses every reader. Two
  diagrams that each fit are read; one that does not is skimmed.
- **Why measure in the browser, not in the file.** Fonts fall back, CSS scales the drawing,
  transforms move groups. A label that fits in the source file can overrun its plate on the
  screen, and only the drawn page shows it.
