# Chart Rules

Rules for anything that renders data as marks: charts, sparklines, gauges, timelines.

These sit **on top of** [engineering-rules.md](../../kz-engrules/rules/engineering-rules.md) and
[ui-rules.md](ui-rules.md), never instead of them. Everything around a chart is ordinary
UI and obeys the UI rules: the table beside it (S1, T1, T2, T3), the toolbar control
heights (L5), the buttons and their explainers (B1, B2), the themed chrome (Y3), and
feedback on anything that loads (A1).

The live reference for every rule here is `ui-rules-visual.html` (the reference page and the browser checks in the project this corpus came from (not carried in this package)).

---

## These are defaults, not laws

Every rule here is a **default**: what to do when the project has not decided otherwise.
A project rule always wins.

**Order of precedence, highest first:**

1. **An explicit instruction in the current task.** "Just sketch it, no polish" overrides
   the production-quality rules for that task.
2. **The project's own rules**, wherever they live: a `CLAUDE.md`, a design system, a
   documented convention, a lint or CI rule.
3. **The existing code**, when it is consistent. If every table in the codebase already
   uses one filter pattern, match it rather than introducing the one written here. A rule
   followed in one screen and nowhere else is worse than either choice applied
   consistently (rules 12, 13 and D4).
4. **These documents.**

**How to depart from a rule:**

- Say which rule and why, in one line, at the time. Do not depart silently: the next
  person cannot tell a decision from an oversight.
- If the project keeps departing from the same rule, the rule is wrong for this project.
  Change it here rather than overriding it every time.
- Record the project-specific version where the project's rules live, not in this file.
  This file stays general.

**What does not bend, whatever the project says:** the safety floor. Input validation at
trust boundaries, error handling that prevents data loss, security measures, accessibility
basics, and the confirmation guard on destructive actions (S2). A project convention that
removes one of those is a bug in the convention, so raise it rather than following it.

---


## C: Chart rules

| # | Rule |
|---|---|
| C1 | **Choose the chart from the question, not from the data shape.** Write the sentence the reader wants answered, then pick the mark that answers it. See Appendix CH. |
| C2 | **A chart renders what its table is showing.** Any search, sort, filter or selection on the table re-renders the chart, its legend and its totals from the visible rows. Applies whenever a chart is created. The one exception is order, where the axis has an order of its own: see C18. See Appendix CA. |
| C3 | **Test every chart at 0, 1 and all rows.** The degenerate counts are where charts break silently: a 100 percent slice draws nothing, one row divides by zero. See Appendix CA. |
| C4 | **A time chart ships range presets and derives its granularity.** Rolling and calendar ranges stay on separate rows; the bucket comes from the span, capped at 40 marks, overridable. See Appendix CB. |
| C5 | **A highlighted mark shows its values, and selection is multiple.** **The highlight is drawn on the mark's own outline, never as a rectangle round its bounding box** (Appendix CC). Hover or select from either side; the chart shows the numbers. Selection takes many marks, lists them, and reports their combined figure with a visible Clear. **Where the chart is the primary view of a data set.** A chart embedded as a glyph inside a larger component - a sparkline in a KPI tile, a status dot, a bar inside a table cell - inherits the parent's readout and selection, and adds none of its own. See Appendix CC. |
| C6 | **Aggregate with the right operation for the measure.** Amounts sum, balances take the last value, rates recompute from summed sources, OHLC takes first / max / min / last. Averaging the wrong thing produces a plausible, wrong chart. |
| C7 | **Never rely on colour alone.** No **value** may be carried by colour alone: direction, category and state carry a second channel too - fill, shape, position or a label - and it has to survive greyscale and red-green colour blindness. Colour as *identity*, tying a legend swatch to its series, is the intended use and is not what this forbids (see Appendix CI). |
| C8 | **Label the axis and state the unit.** "RM thousands", "per site", the date range. A number with no unit is a rumour. |
| C9 | **Start a bar axis at zero.** The length of a bar is the message, so truncating the axis lies. A line chart may crop to the data range, and should say so when it does. **Where the measure has a meaningful zero.** An index against 100, a diverging bar around a baseline, a z-score or a temperature is measured from that baseline instead, and the baseline is drawn and labelled so it cannot be mistaken for zero. |
| C10 | **Every chart can be read as a table.** The table beside it is the accessible version, the exportable version, and the one people check numbers in. A chart with no table is decoration. **Where the chart is the primary view of a data set.** A glyph-scale chart inside another component - a sparkline in a KPI tile, a bar in a table cell - is read through the table that component already sits in or beside, and does not carry a second one. |
| C11 | **Every mark is explained.** A bar, a line, a band, a marker, a dashed outline: if it is on the chart, something names it. An unexplained reference line is read as decoration or as an error. See Appendix CD. |
| C12 | **A chart type keeps the marks that define it.** The reference marks are not optional extras to be dropped when a control changes; without them the chart silently becomes a different, weaker chart. See Appendix CD. |
| C13 | **One unit per scale.** Measures plotted as siblings must share a unit and a scale. A percentage, a count and an amount cannot be bars in the same track. See Appendix CD. |
| C14 | **The readout reports the measure the chart is plotting.** Hover text, the selection aggregate and the rank are derived from the measures actually drawn, never from a key fixed at build time. See Appendix CE. |
| C15 | **The legend describes the rows on screen, and is derived wherever those rows are.** It is computed from the drawn rows on every draw, including the draw that draws nothing - in an imperative renderer that means inside the draw and above the empty guard, and never once at load, after an early return, or inside the row loop; in a declarative one it means derived from the same rows the marks are derived from, not from a cached or global set. A legend built anywhere else describes the data it was built from rather than the data on screen. See Appendix CE. |
| C16 | **A legend control must survive being used.** Switching a series off must not remove the control that switches it back on, which is what happens when the hidden series is filtered out of the set the legend is built from. See Appendix CE. |
| C17 | **Every series gets marks, and every mark is reachable.** A line with no points cannot be hovered, focused or tapped, so one of the series answers questions and the other does not. Each mark carries `tabindex`, a `role` and an `aria-label` stating its own values. See Appendix CE. |
| C18 | **An ordered axis belongs to the chart, not to the table.** Where position along the axis carries meaning - time, a bridge, a funnel, a process - the table sorts freely and the chart re-seats its marks in axis order, and says which order it is in. Everywhere else C2 holds and the chart follows the table. See Appendix CF. |
| C21 | **One orientation for every label in a set, and the share goes inside the mark while the name goes outside it.** Turning each label whichever way it happens to fit - along the arc here, along the radius there - is unreadable even when every label individually fits, because the reader cannot tell which rule is in force. Pick one and size the chart to it. On a radial chart that means the percentage horizontal inside the segment and the name raying outward, which also keeps long names out of the geometry entirely. See Appendix CJ. |
| C20 | **A legend entry acts on the marks it names.** Hide where hiding is safe, filter through the table's own column filter where the dimension is a column, highlight where removing marks would break the chart. Passive is only for an entry that names no subset: an encoding note that describes every mark, or a single marker. A legend that only explains is half a legend. See Appendix CI. Where a legend entry genuinely cannot act, see [ui-rules.md](ui-rules.md) rule B3 - but that is the second answer, not the first. |
| C19 | **A row the chart is not drawing says so, and totals count only what is drawn.** Where a legend toggle withholds a mark but the row stays in the table (C16), the row is marked, the footer total excludes it and the count says how many are drawn. Otherwise the table states one total and the chart states another, and both look right. See Appendix CG. |

---

## Appendix CH: Choosing the chart (C1)

Start from the sentence the reader wants completed. The data shape narrows the options;
it does not choose for you.

| The question | Chart | Not this |
|---|---|---|
| How does this split up? (few parts, sums to a whole) | Donut or pie, 6 slices at most | More than 6 slices: use a ranked bar |
| Which are biggest? | **Horizontal ranked bar** | A pie. Long labels and close values are unreadable as angles |
| How does it split up **over time**? | Stacked bar, or 100 percent stacked for share | A pie per period |
| How has one measure moved? | Bars for discrete periods, line for a continuous trend | A line over categories that have no order |
| How do several measures move together? | Multi-series line, legend toggling | Dual y-axes: two scales make any two lines agree |
| Open, high, low, close | Candlestick | A line of closes, which hides the range |
| Are we on track against a target? | Bullet, or a progress bar with the target marked | A gauge: a quarter of the ink for the same fact |
| How did we get from A to B? | **Waterfall** | Two bars and mental arithmetic |
| Where does the pipeline leak? | Funnel | A bar chart of stage counts, which hides the drop-off |
| What runs when, and what overlaps? | **Gantt or timeline** | A table of dates |
| Is there a relationship between two measures? | Scatter, bubble for a third | A line: a line implies order that does not exist |
| How are values distributed? | Histogram, or a box plot to compare distributions | A bar chart: a histogram has continuous bins, and confusing them is common |
| What is the number right now? | **KPI tile**: the number, a delta, a sparkline | A single-bar chart |
| Which cells are hot? | Heatmap, or shading inside the existing table | A 3D surface |
| How did the mix move over time? | **Stacked area**, or a stream when only the shape matters | A stacked bar with fifty periods |
| Which band is growing? | **Stream graph**, paired with a table for the values | A stacked area, where only the bottom band sits on a flat baseline |
| A value that jumps and then holds | **Step line** | A straight line, which claims it moved gradually |
| Who overtook whom? | **Bump chart** | A multi-series line of the amounts, where the crossings are lost among the gaps |
| Who is above and below a line? | **Diverging bar** | Two charts, or a bar chart with a mental subtraction |
| How does a hierarchy split up? | **Sunburst**, or a treemap where the leaves are many | Nested pies |
| What came from where, and what became of it? | **Sankey** | Two pies and a sentence |
| Where is the work? | **Tile map**, shading a normalised measure | A choropleth on real borders shading a raw total |
| One subject across several criteria | **Radar**, single series only | A radar with two or more series: see Never |

### Defaults when two fit

- **Bar over pie**, unless composition of a whole is genuinely the question and there are
  few parts.
- **Horizontal over vertical** when labels are long or there are more than about eight
  categories.
- **Table over chart** when the reader needs exact values more than shape. Many "charts"
  in business apps should have been a well-built table (S1).
- **One chart over two** when a second series answers the same question. Two charts when
  the questions differ.

### Never

| Never | Why |
|---|---|
| 3D anything | The perspective distorts the values it exists to show |
| Dual y-axes | Two independent scales can be tuned to make any two series look correlated |
| Radar with more than one series | Area scales with the square, and the shape depends on the arbitrary order of the axes. A single-series radar is allowed, and states its axis order. Built on the page so the failure is visible rather than asserted |
| A nightingale rose with a linear radius | Radius scaled by the value makes twice the value draw four times the ink. The radius is the square root, or the chart is not telling the truth. The page has a toggle so the difference can be seen |
| A choropleth of a raw total | Shading a count on real borders produces a map of where the land is and where the sites are, not a finding. Normalise the measure, and use equal tiles when comparability matters more than geography |
| A flow diagram that does not balance | If what leaves the sources is not what arrives at the outcomes, the picture is wrong and the arithmetic has to say so rather than the bands quietly absorbing it |
| Pie past six slices, or nested pies | Angles are hard to compare; small slices are unreadable |
| A donut whose centre is empty | The hole is the best real estate on the chart: put the total in it |
| Truncated bar axis | See C9 |
| Animated transitions between unrelated data sets | The motion implies a relationship that does not exist |

### Before building any chart, answer these

1. What sentence does the reader want completed?
2. What is the unit, and over what period?
3. What is the comparison: against last period, against a target, against each other?
4. What happens when there are 0 rows, 1 row, or 10,000?
5. What does the table beside it show?

If question 1 has no clear answer, the chart is decoration and the honest move is to say
so rather than build it.

---

## Appendix CA: Chart and table are one component (C2)

A chart and the table beside it are two views of **the same rows**. If the table can
filter, sort or search, the chart must move with it. A chart that keeps showing the full
data set while the table shows three rows is not a second opinion, it is a contradiction,
and the user has no way to know which one to believe.

**The rule applies whenever a chart is created**, not only when someone asks for it.

### How to wire it

One direction of data flow: the table owns the filter state, and the chart is rendered
from whatever the table is currently showing.

```
  filter / sort / search
          |
          v
    table.visible()  ->  rows
          |                |
          v                v
      <tbody>          drawChart(rows)
```

- Every draw function takes the rows as an argument. A `drawChart()` that reads the
  global data set directly cannot follow anything.
- **One notification path from table to chart, and the filters do not own it.** The table
  announces the rows it drew and the chart redraws from that announcement - an `onDraw(rows)`
  callback here, a derived value or a subscription elsewhere. Redrawing from the filter
  handlers instead means several handlers, and one of them will be forgotten.
- Boot the page by drawing the **tables**, and let them draw the charts. Two separate
  boot calls will drift.

### What must follow

| Table action | Chart effect |
|---|---|
| Column filter applied | Chart re-renders from the remaining rows |
| Table search | Same |
| Sort | Ordered marks (bars, slices) follow the new order. **The chart never sorts for itself**, unless its axis has an order of its own: see C18. |
| Row hover | The matching mark highlights, and the reverse |
| Legend or series toggle | Removes the series from both, and from any total |
| Everything filtered out | Chart shows an explicit empty message, never a blank frame or a NaN axis |

### Test every chart at 0, 1 and all rows

Filtering makes row counts the chart was never drawn with completely normal. Both ends
break, and they break silently: the numbers keep updating while the drawing disappears,
which is worse than an error because it looks like an answer.

| Rows | What breaks | What to do |
|---|---|---|
| **0** | Scale functions divide by zero and emit `NaN` in the path data. The chart renders blank or disappears. | Return an explicit "No rows match the current filters" message before computing any scale. |
| **1** | See below: a single 100 percent slice draws nothing; a single bar or point has no spacing to derive; a line chart has no line. | Special-case it. A one-point line chart should still show the point. |
| **all** | Nothing, which is why it is the only case that usually gets tested. | Do not stop here. |

**The full-circle trap.** In a pie or donut, one slice covering 100 percent has an arc
whose start and end points are **identical**. SVG draws nothing at all: not a small
error, an empty frame. The totals in the middle keep updating, so it reads as a rendering
failure rather than a data state.

```js
if (frac > 0.9999) {
  // a ring, drawn as a stroked circle: no arc endpoints to collapse
  parts.push('<circle cx=.. cy=.. r="' + ((R + r0) / 2) + '" fill="none" stroke="' +
             colour + '" stroke-width="' + (R - r0) + '"/>');
} else {
  // the normal two-arc wedge path
}
```

The same class of bug appears elsewhere: a bar chart with one bar computes a bar width
from `width / n` and can end up full-bleed; a candlestick with one candle has no
min-to-max range, so `(v - lo) / (hi - lo)` divides by zero when high equals low. Clamp
the range, do not assume it is non-zero.

**Geometry comes from the visible rows, not the full data set.** It is not enough to
draw the right number of marks: the spacing, the bar width and the axis range must all be
derived from the rows being shown. A chart that renders 3 bars but still divides the width
by 12 clusters them at the left edge with two thirds of the plot empty, which reads as
missing data rather than a filtered view.

```js
var n = rows.length;                        // not DATA.length
var bw = Math.min(iw / n * 0.62, 46);       // clamp, or one row becomes a full-bleed bar
```

Clamp the mark width. Without it, a single row produces one bar as wide as the chart, and
a candlestick body wider than it is tall.

**The legend is part of the chart.** When the table filters categories out, the legend
must show them as excluded rather than listing five colours for one visible slice. A
legend that disagrees with the chart is the same contradiction as a chart that disagrees
with its table.

### Order is part of "what the table is showing"

The easiest version of this rule to break, because the chart's own sort looks harmless
and is usually correct on first render:

```js
// wrong: the chart decides its own order, and disagrees with the table the moment
// the user sorts any column
rows = rows.slice().sort(function (a, b) { return b[measure] - a[measure]; });

// right: render what you were handed
rows.forEach(draw);
```

A "ranked" chart is not exempt. Ranking is a **default sort**, not a property of the
chart: set it on the table (`table.setSort(key, -1)`) and let the order flow back. Then
picking a different measure re-ranks both sides together, and a user sorting the table
alphabetically gets an alphabetical chart, which is what they asked for.

The label on the chart should state the order it is in, read from the table's sort state
rather than from a constant: `ordered by revenue, descending`. If that caption is
hard-coded, it will eventually lie.

**The exception, and it is a real one:** a chart whose axis carries its own order. See
C18 and Appendix CF. Those charts state their order too, but the order they state is
their own.

### Consequences

- **Aggregates recompute.** A total, an average or a percentage in the footer or the
  centre of a donut reflects the visible rows, not the original data. See the rounding
  rule in Appendix A of the UI rules.
- **Scales recompute.** A y-axis, a min and a max derive from the visible rows. Leaving
  the axis fixed to the full data set makes a filtered chart look empty or flat.
- **Guard the empty case.** Zero rows divides by zero in almost every scale function.
  Return an explicit "No rows match the current filters" message before computing
  anything.
- Keep the chart read-only where possible. Two-way binding, where clicking a chart mark
  also filters the table, is fine, but only one of them owns the state.

Reference implementation: the three chart panels in
`ui-rules-visual.html` (the reference page and the browser checks in the project this corpus came from (not carried in this package)). Filter any column and watch the chart, the
footer totals and the axis all move together.

---

## Appendix CB: Time ranges and granularity (C4)

A time chart needs two decisions: **how much time** (range) and **what each mark is**
(granularity). The user picks the range; granularity is derived. Do not make people
choose both.

### Ranges: two vocabularies, kept apart

"Last 12 months" and "this year" are different numbers, and people conflate them
constantly. Put them on separate rows so the distinction is visible:

```
Rolling    [ 7D ][ 30D ][ 3M ][ 1Y ][ 2Y ][ 3Y ][ 5Y ][ Max ]
Calendar   [ This week ][ This month ][ This quarter ][ YTD ]
           [ Q1 ][ Q2 ][ Q3 ][ Q4 ][ Full year ]  [ 2025 v ]
Each mark  [ Day ][ Week ][ Month ][ Quarter ][ Year ]   13 x month (auto)
```

- **Rolling** ranges end today and count backwards. They answer "how are we doing".
- **Calendar** ranges snap to period boundaries. They answer "how did Q2 go", which is
  what a report or an invoice run needs.
- A year picker applies only to the absolute options, and is disabled for the
  period-to-date ones.

### Granularity: derive it, with a 40-mark ceiling

**Pick the finest bucket that produces at most 40 marks.** Past 40 a time chart stops
being readable, so the bucket steps up a unit.

```js
var MARKS_MAX = 40;
function autoGran(spanDays) {
  for (var i = 0; i < GRANS.length; i++) {          // day, week, month, quarter, year
    if (spanDays / GRANS[i].approx <= MARKS_MAX) { return GRANS[i].id; }
  }
  return GRANS[GRANS.length - 1].id;
}
```

What that produces, verified in the sample:

| Range | Marks | Bucket |
|---|---|---|
| 7D | 7 | day |
| 30D | 30 | day |
| 3M | 14 | week |
| This quarter | 12 | week |
| YTD | 38 | week |
| 1Y | 13 | month |
| 2Y | 25 | month |
| 3Y | 37 | month |
| 5Y / Max | 21 | quarter |

A fixed range-to-bucket table looks equivalent but leaves holes: 2Y, quarters and YTD
were all unspecified in the first draft of this rule, and any range added later is
unspecified again. The ceiling rule has no holes.

**Always expose a manual override.** Auto is the default, not a cage. Show which bucket
is active and whether it was chosen automatically (`13 x month (auto)`), and disable
overrides that would blow far past the ceiling.

### The five traps

1. **The partial last bucket.** Today is the 17th, so this month holds 17 days of data
   and its bar is barely half height. That is not a collapse in revenue. Mark it: draw it
   hollow or dashed, label it `partial` in the table, and say so in the tooltip. The
   alternative is to exclude it, but then say that too.
2. **Empty buckets must still be drawn.** A week with no activity is a zero, not a
   missing mark. Skipping it silently rewrites the x-axis and invents a trend. Walk the
   calendar, not the data.
3. **Aggregation depends on the measure.** Revenue sums. A balance or a headcount takes
   the last value. **OHLC takes open = first, high = max, low = min, close = last.**
   Averaging a candlestick produces a plausible, wrong chart.
4. **Week start and timezone.** Monday versus Sunday shifts every weekly bucket; UTC
   versus local shifts every daily one. Decide once, state it in the code, keep it
   consistent with whatever the backend reports.
5. **Axis labels must thin out.** 40 marks will not fit 40 labels. Label every nth mark
   so the axis stays legible, while every mark keeps its tooltip.

### The table re-buckets with the chart

C2 applies: if the chart shows 13 months, the table shows 13 month rows, not 400
daily ones. The table is a reading of the same buckets, including the partial flag.

---

## Appendix CC: Highlight, readout and selection (C5)

Highlighting a mark tells the user **which** one. It does not tell them what it says. A
chart that dims four slices and brightens one, with no numbers anywhere, has answered a
question nobody asked.

Every chart carries a **readout**: a small panel, inside the chart area, showing the
values of the mark currently highlighted.

```
+-----------------------------+
| # Renovation      [PINNED]  |
| Amount        RM 1,840,000  |
| Share of all         47.6%  |
| Share of view        47.6%  |
+-----------------------------+
```

### Symmetry is the point

The same interaction must work from both sides, and mean the same thing:

| Gesture | Effect |
|---|---|
| Hover a chart mark | Mark highlights, readout fills, matching table row highlights |
| Hover a table row | Identical: mark highlights, readout fills |
| Click either one | **Adds it to the selection**: readout stays when the pointer leaves, row shows a selected marker |
| Click again | Removes it from the selection |
| Click more marks or rows | Selection grows; the readout switches to an aggregate |
| Clear button, or Escape | Clears the whole selection |
| Tab to a mark | Same as hover; marks are focusable, so this works without a mouse |

If hovering a row highlights the chart but hovering the chart does nothing for the table,
the interaction is half-built and users will not trust either direction.

### The highlight follows the mark's outline

A wedge, a bubble and a ring segment are not rectangles. A highlight that is one - the
browser's default focus ring on an SVG element, or a box computed from the shape's bounding
box - reads as a mistake: it spans the hole, covers the neighbours and says nothing about
where the mark's edge is. Found on a sunburst: click a segment and a white box appeared round
it, overlapping three others.

- **Hover, focus and selection are drawn from the mark's own geometry.** Two ways that work.
  A `stroke` on the shape, for a mark that is filled and has no stroke of its own. Or a
  `drop-shadow` filter, which is built from the shape's outline and so works on a path, a
  circle or a group alike: four hairline offsets
  (`drop-shadow(1.5px 0 0 c) drop-shadow(-1.5px 0 0 c) drop-shadow(0 1.5px 0 c)
  drop-shadow(0 -1.5px 0 c)`) make a crisp ring, one blurred shadow makes a soft halo.
- **Make the ring two-tone.** A ring of one colour contrasts with the surface and says
  nothing about the mark beside it: measured, a near-black ring had 17:1 against the page
  and 1.2:1 against a black mark, and a near-white one 14:1 against the page and 1.5:1
  against a mint wedge. A thin ring in the **surface** colour next to the mark, then a
  ring in the **text** colour outside it, always has one tone that contrasts with what it
  overlaps - in either theme, whatever the mark's colour.
- **Remove the browser's ring where you replace it** (`outline: none`). Leave both and the
  box is still there, with the ring inside it.
- **A neighbour painted later covers a shared edge by a pixel or two.** Where that matters,
  paint the focused or selected mark last.
- **`outline` is still right on a `rect`, on an HTML element, and on a transparent hit
  area:** their box is their shape. A filter cannot trace a transparent hit rect - there is
  no outline to trace - so a keyboard user would see no focus at all. Keep the outline there.

**The test:** press a segment, then Tab to another. Each is ringed along its own edges and
nothing else - the pressed one stays ringed while it is selected. A selected mark that only
brightens, with no outline, has a highlight nobody can see on a colour the same as its
neighbour's.
`layout-audit.js` fails an SVG shape whose only focus ring is the bounding box (`FOCUS BOX`).

### Selection is multiple, and it aggregates

**One selected mark is a special case of many, not the design.** The reason to select at
all is usually comparison: these three categories against the rest, these two months
against each other. A single pin cannot express that.

| Selected | Readout shows |
|---|---|
| 0 | Nothing; the chart is undimmed |
| 1 | That row, exactly as hovering it would |
| 2 or more | An **aggregate** of the selection, with a count in the badge |

A hovered mark always takes precedence over the selection, so the user can inspect one
item without losing what they have selected.

**The aggregate must be the right operation for the measure**, which is the same trap as
bucketing (Appendix CB):

| Measure | Aggregate |
|---|---|
| Revenue, counts, amounts | Sum, plus an average where it means something |
| Percentages, rates | Recompute from the summed source values, never average the percentages |
| A balance, a headcount | Last value, not sum |
| OHLC | Open = first, close = last, high = max, low = min, net change = last close against first open |

Add what the table cannot easily show: a collection rate across the selection, the
largest and smallest member, how many periods rose.

### Show the members, then the combined figure

A combined number on its own raises the question it was meant to answer: *which rows
make that up?* List them, then total them.

```
+---------------------------------+
| 3 of 5 categories  [3 SELECTED] |
|  # Renovation             47.6% |
|  # Maintenance            23.8% |
|  # Fit-out                15.8% |
|  ------------------------------ |
|  Combined                 87.2% |
|  Amount           RM 3,370,000  |
+---------------------------------+
```

- **Members first, in the chart's own order** (largest first for a pie, chronological for
  a time series), each with its own value and its colour swatch so the list maps back to
  the marks.
- **Cap the list** at around five and add `+ N more`. The panel must not grow until it
  covers the chart it is describing.
- **A separator, then the totals.** The combined line is visually distinct from the
  members, or the eye reads it as one more member.
- **Include the denominator that makes the figure meaningful**: combined share of the
  whole, and separately of the current filtered view when those differ.

### Clearing must be obvious

A selection the user cannot see how to escape is a trap. Provide **all** of:

- A **Clear** control in the readout itself, labelled, next to the count.
- A **Clear N selected** button in the table toolbar, hidden when nothing is selected, so
  the way out exists even when the readout is scrolled off.
- **Escape** clears every chart selection on the page.
- Clicking a selected mark or row again removes just that one.

### The trap: a control inside a click-through panel

The readout is `pointer-events: none` so it never blocks the marks beneath it. That
creates two failures in sequence, and the second one is invisible in code review:

1. **The control cannot be clicked at all.** Its own `pointer-events: auto` is required,
   or the click passes straight through it.
2. **The control moves away as you reach for it.** Worse, and easy to miss. With the
   panel click-through, dragging the pointer towards the Clear button hovers the *marks
   underneath the panel*. Each hover re-renders the readout. If the control only exists
   while nothing is hovered, it disappears exactly when the user aims at it.

Both fixes are needed:

- **Once the panel carries a control, it stops being click-through.**
  `.readout[data-sel="1"] { pointer-events: auto; }` - click-through while it is purely
  informational, interactive once there is something to click.
- **The control persists across hover.** Anything that depends on the selection, not on
  the pointer, stays rendered for as long as the selection exists. Hovering another mark
  may change the values shown; it must not remove the way out.

The general form: **a control must not depend on a state that the act of reaching for it
destroys.** The same bug appears with hover-only row actions, menus that close on
pointer-out, and toolbars that hide when focus moves.

### Readout and cursor tooltip are both needed

They answer different questions and they coexist:

- The **cursor tooltip** follows the pointer and gives detail at the point being touched.
  It is transient and requires hover, so it never exists on touch.
- The **readout** is anchored in the chart, survives the pointer leaving when pinned, is
  readable on touch, and is a live region so a screen reader announces it.

Do not replace one with the other.

### Rules

- The readout is `pointer-events: none` **while it is purely informational**, so it never blocks the marks underneath. The moment it carries a control it takes pointer events back - see the trap above.
- It renders **inside the chart area**, not below it: the eye should not travel to read
  what it is pointing at.
- Selection survives a redraw. Filter the table, and members still visible stay
  selected; members filtered out are dropped rather than contributing to an aggregate
  for rows that are no longer on screen.
- Include derived context the table cannot show as easily, such as share of the current
  view versus share of the whole.

---

## Appendix CD: Marks, identity and scale (C11, C12, C13)

Three failures I shipped in the same chart, each of which turns a chart into a different
and worse chart without any error appearing.

### C11: every mark is explained

The bullet chart drew a vertical rule on every row with nothing anywhere saying what it
was. The reader's options are to guess, to ignore it, or to assume it is a rendering
fault. All three are failures of the chart.

- **Every mark type gets a legend entry**, including the ones that are not series: target
  markers, reference lines, thresholds, bands, projections, the dashed outline of a
  partial period.
- **Shape the swatch like the mark.** A rule is a 2px vertical line in the legend, a band
  is a translucent block, a bar is a bar. A row of identical dots explains nothing.
- **Build the legend from what is actually drawn**, so it can never describe a mark that
  is not on screen, or omit one that is.
- **Say it again in the tooltip.** `Target RM 2100k (the vertical rule)` costs nothing and
  removes the last doubt.
- The test: **point at each distinct mark and ask where the page says what it is.** If the
  answer is nowhere, the chart is not finished.

### C12: a chart keeps the marks that define it

A bullet chart is a bar judged against its own target, with a qualitative band for
context. I added a measure picker, and drew the target only when exactly one measure was
plotted. Ticking a second measure silently removed the target, and the chart became a
ranked bar with extra rows.

- **Identify the marks that make the chart what it is** and draw them unconditionally: the
  target on a bullet, the reference line on a variance chart, the zero line on a diverging
  bar, the today marker on a Gantt.
- **The primary measure is not removable.** If the picker can untick the thing being
  judged, the judgement disappears.
- A control that changes what is plotted **must not change what kind of chart it is**.
- Useful check: with each control setting, can you still answer the question in the
  chart's title? Ours said "are we on track" while showing nothing to be on track
  against.

### C13: one unit per scale

The same picker offered `Of contract` (a percentage) and `Variance` (a signed amount)
alongside `Claimed` (an amount), each scaled to its own maximum. Bars of different units,
each normalised separately, sit side by side looking directly comparable and are not.

- **Sibling bars share a unit and a scale.** Claimed, target and contract are all ringgit,
  so they share one scale and can be read against each other.
- **A per-measure scale is a lie in disguise.** It makes every bar reach the same place,
  which is exactly what the reader uses length to compare.
- **Off-unit columns stay in the table.** They are still sortable, filterable and useful
  there; they are simply not bars.
- **A shared scale must cover every mark it carries.** Ours scaled to the maximum
  *claimed* while drawing a *target* marker that could exceed it, so the marker escaped
  the track and overlapped the value beside it. Take the maximum across every value the
  scale has to hold.

### And a fourth: a bar needs room to differ

A ranked bar in a 133px track shows twelve values that all look the same length. Bar
length is the entire message, so **measure the track**: below a usable width, move the
label onto its own line and give the bar the full width. See rule V3 and Appendix K for
why this has to be measured rather than assumed from a breakpoint.

---

## Appendix CE: The draw path (C14, C15, C16, C17)

Eleven charts on one page, all passing their behaviour checks, all rendering. A review
pass found twelve defects, and nine of them were the same mistake in different clothes:
**something was computed outside the draw, or before the draw knew what it was drawing.**

The page looks correct in every case. That is what makes this class worth its own
appendix: there is no error, no blank area, no visible symptom. The chart simply answers
a question that nobody asked.

### The shape of the mistake

| Where it was computed | What went wrong |
|---|---|
| A measure key written into the readout | The picker changed what was plotted; the readout still described revenue |
| The legend, once at load | Filtering the table left entries for marks no longer on screen |
| The legend, after the empty guard | The chart emptied and kept the legend from the last draw |
| The legend, inside the row loop | Rebuilt and rebound five times per draw, last write wins |
| The legend, from the post-filter rows | Hiding a series deleted its own un-hide button |
| The KPI tiles, from the source array | Two bars on the chart, the whole year in the tiles |
| `aria-label`, from the shared scale | Every row announced the largest contract on the chart as its own |

### The rule that covers all of them

**Everything a chart shows is a function of the rows it was handed.** If a value is read
from anywhere else, it is stale the first time the user touches a control.

```js
function draw(rows) {          /* rows come from the table, always */
  var ms = measuresOf(rows);   /* what is plotted, derived here */
  drawLegend(rows, ms);        /* before the guard, from the same rows */
  if (!rows.length) { return showEmpty(); }
  ...                          /* marks, readout and aria all from rows and ms */
}
```

Three positions to check in any chart draw:

1. **Above the empty guard:** the legend and anything else that must be correct when
   there is nothing to draw.
2. **Once per draw, not once per row:** anything that describes the whole chart. If it is
   inside a `map` or a `forEach` over rows, it is being rebuilt N times.
3. **Never outside the function:** if it is at module level, it ran once, with the data as
   it was at load.

### C16 in detail: the control that deletes itself

The index chart hid a series by excluding it from the table's row set. The legend was
built from that row set, correctly, per C15. Switching a series off therefore removed its
own button, and there was no way back short of a reload.

- **A visibility toggle filters the DRAW, not the set the controls are built from.** The
  row stays in the table and in the legend; only the mark is withheld.
- **The toggle shows its state** with `aria-pressed` and a muted swatch, so an off series
  is visibly off rather than absent.
- **The last visible series cannot be switched off.** An empty chart with no way back is
  the same defect with one more step.
- The general form: **no control may depend on state that using it destroys.** The same
  rule caught the Clear button inside a click-through readout (Appendix CC) and a filter
  panel that closed when its own list was scrolled (rule N2).

### C17 in detail: a series nobody can point at

A combo chart drew bars for revenue and a line for collections. Every bar was focusable
and carried a readout. The line was a `polyline` with 2px decorative dots, so half the
chart answered questions and half did not, and nothing said so.

- **Every series gets marks**, whatever its shape: points on a line, a hit area on a band,
  the segments of a stack.
- **A mark is at least 3px**, or carries an invisible hit area that is.
- **Each mark is a real control**: `tabindex="0"`, `role="button"`, and an `aria-label`
  that states *that mark's own* values.
- The `aria-label` failure is worth naming separately: geometry is shared across rows and
  values are not. Labelling a bar with the scale maximum tells a screen reader a fact
  about the chart and calls it a fact about the row.

### How to catch it

Behaviour checks do not find any of this, because nothing throws and everything renders.
Two cheap probes do:

- **Change one control and re-read every number on the chart.** Untick a measure, hide a
  series, filter to two rows: then check the readout, the aggregate, the KPI tiles and the
  legend, not just the marks.
- **Run the 0 / 1 / all state check** (`state-check.js` (the reference page and the browser checks in the project this corpus came from (not carried in this package))). It drives every
  table to those three states and asserts that each visible row has a mark, each mark has
  a row, the count agrees, and an emptied chart says so rather than keeping its last draw.

---

## Appendix CF: An ordered axis (C18)

C2 says the chart follows the table. That is right for a ranked bar, a pie or a scatter,
where the order is either the answer or irrelevant. It is wrong for a chart whose x axis
*is* a sequence, and following it there produces a chart that is not merely mis-sorted
but meaningless.

### What it looked like

| Chart | One click on a column header | Result |
|---|---|---|
| Time series | Sorted Period A to Z | `Apr 26, Aug 26, Dec 25, Feb 26, Jan 26 ...` drawn as a time axis, with a collections trend line joining the dots in that order |
| Waterfall | Sorted Change, largest first | The closing bar landed fourth of eight and reported `RM -325k` as the final account. The real figure was `RM 2572k` |
| Candlestick | Sorted Close | Sessions out of sequence, so every body and wick compared a price against a price from another week |
| Stacked bar | Sorted Consultancy | Quarters shuffled, so the shape over time was gone |

None of them threw. None of them looked broken; the waterfall in particular looked
entirely plausible and stated a number that was wrong by RM 2.9 million.

### The rule

**Ask whether position along the axis carries meaning.** Time, a bridge, a funnel, a
process, a pipeline, a sequence of sessions: all yes. A ranking, a set of categories, a
scatter: all no.

- Where it does: the chart re-seats its marks in axis order on every draw, whatever the
  table hands it. The table still sorts, because the table is a list and sorting a list
  to find the largest step is exactly what a table is for.
- Where it does not: C2 stands, and the chart follows the table's order exactly.

```js
/* one helper, so the charts that do this cannot drift apart */
function inAxisOrder(rows, src) {
  return rows.slice().sort(function (a, b) { return src.indexOf(a) - src.indexOf(b); });
}
```

The source array *is* the axis order, so there is nothing to configure and nothing to
keep in sync.

### Say which order it is in

Two charts side by side, one following the table and one not, is confusing unless both
say so. Each ordered-axis chart carries a legend key in one shared wording:

> Drawn in bridge order: opening, each step, closing, whatever the table is sorted by

That is C11 (every mark explained) applied to the axis itself, and it is also what stops
the reader assuming the chart is ignoring them.

### The three places this leaks

1. **A date column that sorts on its label.** `Sep 25` sorts under S. The column must
   sort on the underlying key, which is what `sortVal` is for. Sorting a date
   alphabetically is wrong in the table too, not only in the chart.
2. **"Latest" read positionally.** A KPI tile taking `rows[rows.length - 1]` names
   whatever is last in the current sort. Latest is a fact about time: take it from the
   axis order, not from the array.
3. **A running total computed in table order.** The waterfall's arithmetic walks the rows
   it is given. Ordering the rows correctly fixes the total as well as the picture, which
   is the tell that this is one defect and not two.

### And when the total is not the total

Filtering steps out of a waterfall is legitimate, and the running total is then
recomputed over what is shown. But the closing bar still says "Final account", and a
recomputed figure under that label is a false statement. The chart says so, in the
legend, whenever the step count is short of the source:

> Steps are filtered out, so the closing bar is the total of what is shown, not the
> final account

The general form: **when a figure is derived from a subset, the figure says so where it
is displayed**, not in a note somewhere below the chart.

---

## Appendix CG: A row the chart is not drawing (C19), and the cost of the C16 fix

C16 says a visibility toggle must not delete its own control, so the row stays in the
table and only the mark is withheld. That fix, applied on its own, produces a second
defect immediately:

> Renovation switched off. The chart reads `TOTAL RM 2,025,000`. The table footer
> directly beneath it reads `Total 3,865,000 100.0%`. The count chip says `5 rows` beside
> four slices. The row renders exactly like the four that are drawn.

Nothing is broken, nothing throws, and there are two totals on one panel.

### What a withheld row owes the reader

| | |
|---|---|
| **Marked** | Visibly not drawn: dimmed, with `(not drawn)` after its name. Never identical to a row that is on the chart |
| **Out of the total** | The footer totals what is drawn, because it sits beside a chart that states the same figure |
| **Counted separately** | `4 of 5 drawn`, not `5 rows` |
| **Still sortable and filterable** | It is a row. Everything a row can do, it can do |

One `off(row)` predicate on the table gives all four, which matters because two charts
here needed it and any chart with a series toggle needs it next.

### The never-zero guard has two counts

The same C16 bullet says the last visible series cannot be switched off. There are two
ways to reach zero and a guard written against either count alone leaves the other open:

```js
var onAll  = SOURCE.filter(notOff).length;   /* the last series overall */
var onView = SOURCE.filter(function (d) {    /* the last one the search leaves visible */
  return inView(d) && notOff(d);
}).length;
if (!off[k] && (onAll === 1 || onView === 1)) { return; }
```

And there is a third route to an empty chart that no guard can refuse, because no click
causes it: the search narrows to rows that are *already* switched off. That one is not
prevented, it is **explained** - `Every matching category is switched off in the legend`,
which is a different sentence from `No categories match the current filters`, and the
reader needs to know which one they are in.

### Selected means drawn

The related invariant, and the one that took two rounds to state correctly: **a selected
id must have a mark on the chart.** Pruning the selection against the rows the table is
showing is the weaker test, and it passes in exactly the case that matters, because a
withheld row is still a row.

It belongs in the one function every readout is built by, not in each chart's draw: a
draw can return early, and eleven copies of an invariant is eleven chances to put one of
them below a return.

---

## Appendix CI: The legend is a control panel (C20)

The most-repeated correction in this whole project, and the one I kept finding a reason
not to apply. Seven charts had legends you could click. Four did not, and for one of them
I had written a comment explaining why that was fine:

> Every entry here is a key: hiding a step from a waterfall would break the bridge it
> exists to show, so none of them is a control and none pretends to be.

The premise is true and the conclusion does not follow. Hiding is one action. It is not
the only one.

### Three actions, and how to choose

| Action | When | What it does |
|---|---|---|
| **Hide** | Removing the series leaves a chart that still answers its question | Withholds the marks. The row stays in the table, marked (C16, C19) |
| **Filter** | The dimension the entry names is a column | Drives that column's own filter, so the table narrows and the chart follows (C2, rule T4). One mechanism, not two |
| **Highlight** | Removing the marks would make it a different chart | Dims everything the entry does not name. The arithmetic and the distribution survive |

The waterfall highlights, because a bridge without its deductions does not add up. The
scatter highlights, because a distribution with three quarters of its points removed is
not a distribution. The candlestick filters, because direction is a column and the panel
already filters on it. The Gantt filters, because "behind" is a status value.

### What stays passive

An entry that names **no subset of the marks**:

- `Bigger dot means more jobs (area, not radius)` - every mark has a size
- `Today` - one marker, there is nothing to narrow to
- `100 is where each series started, not zero` - a statement about the axis
- `Drawn in bridge order, whatever the table is sorted by` - a statement about the chart

The test is one question: **does this entry name a set of marks I could point at?** If yes,
clicking it must do something to them. If no, it is a key, and a key is styled as text with
no border and no hover so it never pretends otherwise (rule B3).

### Say which action it is

The tooltip names the verb and the direction, because three different actions now live in
the same-looking control:

> Click to filter to up: hollow body, close above open
> Click to stop highlighting deduction

### Why this kept being missed

Rule B3 says a control that cannot act is rendered as a key. That is right, and it is also
an escape hatch: faced with "this cannot be hidden", the cheap move is to demote it to a
key and move on, and the page then looks internally consistent while four of eleven charts
quietly do less than the others.

So the order of the two rules matters. **C20 comes first: find the action.** Rule B3 applies
only after you have established there is none. The check now fails a legend that is
entirely passive, because a rule I can talk myself out of is not a rule.

---

## Appendix CJ: Labelling a radial chart (C21)

Three attempts, and the first two are the instructive ones.

**Attempt one: inside, horizontal.** A phase name centred in its ring segment. It fitted
at twelve o'clock and ran straight across two neighbours at three, because the text is
drawn horizontally and the room a segment offers horizontally depends entirely on where
it sits. The fit test measured arc length; at three o'clock the constraint is the ring's
24px thickness. A test that is right for one angle and wrong for the rest is not a test.

**Attempt two: inside, rotated to whatever fits.** Along the arc where the arc was long
enough, along the radius otherwise. Every label now fitted, and the result was unreadable:

> right now how you place it is really chaotic unalign properly

Which is correct, and worth stating as the rule. **A set of labels is read as a set.** If
one is tangential and the next is radial, the reader has to work out the rule for each one
before reading any of them, and the eye reports chaos before it reports content.

**Attempt three, which is the rule:**

| | Where | Orientation |
|---|---|---|
| The share | Inside the segment | Horizontal. It is two to five characters; it fits, and horizontal is the easiest thing to read |
| The name | Outside the outer radius | A ray: rotated to its own angle, flipped on the left half so none is upside down |

Every name starts on the same radius and points out along its own segment. Nothing is
inside the geometry except a number short enough to sit there comfortably.

### What it costs, and paying it honestly

A ray needs room outside the circle, and at the top and bottom that room is vertical. The
charts that use it are therefore **square**, not the page's usual wide-and-short frame -
340 by 340 rather than 340 by 220. That is the actual cost of the layout, and shrinking
the circle until the rays fit a short box would be paying it by making the chart smaller
while pretending nothing happened.

Two consequences worth knowing before choosing this:

- **Long names cannot ray.** Ten task names averaging sixteen characters would be a
  thicket. The sunburst rays its five phase names, which are short and are the grouping
  the chart exists to show; the task names live in the readout, the tooltip and the table.
- **A share too small for its segment gets no label**, and that is correct. The 4.7 percent
  slice has no room for "4.7%" and does not get a smaller font to squeeze it in: it is in
  the legend, the readout and the table, three places, none of them cramped.
