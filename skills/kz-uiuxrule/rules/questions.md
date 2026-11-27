# Rule questions: the ledger

Every rule as one yes/no question, and after them the chart types, chart nevers, generated-UI
tells, things not to do and design principles the rule files carry beside the rules, for the full path (a project, an audit, "make it production", a
release). A long read of the whole rule corpus loses the rules in its middle; a question per rule,
each decided on its own line and written down, does not.

How to use it, through `../scripts/ledger.py`:

1. `python ../scripts/ledger.py init` copies every row below into `.kz/ledger.md` in the project,
   with three empty columns: Applies, Verdict, Evidence.
2. Go down the list once and fill **Applies** for every row: `yes`, `no`, or `?`. Decide from
   "Applies when" alone; this pass reads no rule text. A `?` is decided before step 4.
3. For each `yes`, read that rule's full text (the ID links to it through `INDEX.md`, or the pack
   that holds it), then build or review against it.
4. Before calling the work done, fill **Verdict** (`pass` or `fail`) and **Evidence** for every
   `yes`: the check and what it printed (`layout-audit: clean at 375`), or, where Check says
   `read`, the file and line that shows it.
   A row whose named check failed is never `pass`. If you judge the check wrong for this page,
   the Evidence starts with `override:` and says why; `status` lists every override, and the
   report names them, so a disagreement with a check is visible and never silent.
5. `python ../scripts/ledger.py status` must print `complete`. It fails while any row has no
   Applies, any `?` is left, any `yes` has no Verdict or no Evidence, or any Verdict is `fail`.

A question is answered `yes` when the rule holds. "Check" names the `kz-uicheck` check that measures
it, with its failure code where it has one; `read` means no check measures it and the evidence is
in the code or on the screen. The rule text always wins over its question. `../../../scripts/validate.py`
fails when a rule has no question here or a question names no rule.

## S - Standing rules

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| S1 | there is a table | Does the table have a search, sort on every column, a T1 filter panel per column, a live count and a no-match state? | table-check NOSORT, NOSEARCH, NOCOUNT |
| S2 | anything deletes, removes, clears or resets | Does every destructive action open a confirm modal naming its target (and the count, for a bulk one), with a labelled cancel and no `window.confirm`? | read |

## D - Fitting the design system

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| D1 | always | Was the project's design system (tokens, theme, component library) found and built into, not beside? | read |
| D2 | any style is written | Does every colour, spacing step and font size come from a token where one exists? | layout-audit UNDEFINED TOKEN; read |
| D3 | a new component is added | Was an existing component reused or parameterised before a new one was written? | read |
| D4 | the screen sits among existing screens | Do its tables, toolbars and empty states match the two nearest screens that already have them? | read |
| D5 | always, unless told it is a prototype | Do the measured checks pass at every width, with nothing from Appendix C's list present? | layout-audit at every width |
| D6 | any style is written | Is the screen free of the generated-UI tells in Appendix C, a coloured stripe down one side of a box included? | layout-audit STRIPE; read |

## L - Layout, spacing and the mobile shell

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| L1 | a screen or a component is laid out | Squinted or blurred, does the eye still land first on what matters most? | read |
| L2 | spacing is set | Does every margin, padding and gap the screen renders resolve to one step of a spacing scale? | read |
| L3 | spacing is set | Are related things closer than unrelated ones, with more space above a heading than below it? | read |
| L4 | a shadow or elevation is used | Does every shadow have an offset and a soft blur, applied by role from a small scale, with no zero-offset glow? | read |
| L5 | controls share a row | Do the buttons, inputs, selects and chips in one row share one height? | layout-audit RAGGED ROW |
| L6 | a growing region sits beside something else | Is the table, list, log or feed beside it capped, scrolling, and given an expand control? | read |
| L7 | content is data-driven | Does the layout hold with long names, 0 items, very many items and translated strings? | layout-audit with long and empty content |
| L8 | it runs on a phone | Is a scrolling phone screen bars plus one scroller, with no content hidden under a bar? | layout-audit COVERED at 375 |
| L9 | a decision offers several actions or options | Does any one decision show at most about seven choices, with one primary? | read |
| L10 | a control strip may not fit across | Does a strip that cannot fit across turn down the side, by measurement, rather than squeeze or hide its items? | layout-audit COVERED; read |
| L11 | items read in order (versions, steps, a timeline) | Does the sequence wrap only while all of it stays in view, and scroll sideways otherwise? | layout-audit WRAPPED SEQUENCE |

## B - Buttons and explanation

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| B1 | there is a toolbar or an action row | Does each button lead with an icon where SVG is allowed, with the label shown when it fits? | read |
| B2 | there are buttons, icon-only ones above all | Does every button explain itself on hover and focus, with a tappable `[?]` on touch, and an accessible name that depends on neither? | explain-check NO EXPLAIN, NO TOUCH PATH, NO NAME |
| B3 | something looks clickable | Is everything that cannot act drawn as a key, with no border, hover or press state? | read |
| B4 | anything is clickable | Does everything that acts show the same visible change on hover, focus and press, at 3:1 or more, without moving? | focus-check NOFOCUS, WEAK |

## T - Tables and columns

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| T1 | there is a filter on a dimension (table, chart, dashboard) | Is every filter a T1 panel (sort, value search, value list with counts, range), or six or fewer chips with a count and a clear? | table-check BOX, CHARTBOX |
| T2 | there is a table | Does every column have a filter, computed columns included? | table-check NOFILTER |
| T3 | there is a table | Does every column header carry a one-line explainer, a tooltip on pointer and a `[?]` on touch? | read |
| T4 | there is more than one way to narrow data | Is there one mechanism per job, with no bespoke dropdown beside the column filters? | read |

## F - Forms and input

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| F1 | a form has required fields | Are required fields marked before they are missed, nudged on leaving empty, and is a refused submit counted with the cursor in the first one? | form-check |
| F2 | there is a field | Does each field validate on blur, clear its error on input, and use the input type that brings the right keyboard? | form-check |
| F3 | a form has more than a few fields, or steps | Does it keep a draft, ask before closing with unsaved changes, and say which step this is? | read |
| F4 | a field takes text written in lines | Is the field more than one line high, growing as typed to a cap? | read |
| F5 | a field takes digits only | Does entering the field select its value? | read |
| F6 | a field holds an amount | Does the field accept the arithmetic that produces it (`12*24`)? | read |
| F7 | a field has a format | Does the field state one pattern, refuse impossible characters as typed, and check the whole value with that same pattern everywhere? | read |
| F8 | there is a field | Can typing go on without the field being rebuilt, its caret moving, the field moving, or the page zooming? | typing-check REBUILT, CARET, MOVED, ZOOM |
| F9 | a form has several single-line fields | Does Enter move to the next field, with only the last one submitting? | typing-check ENTER |

## A - Actions and feedback

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| A1 | an action changes state, takes time or can fail | Does every such action say what happened, through one toast system or a Saved note beside the field? | toast-check |
| A2 | a toast can repeat | Does a repeated toast count on the node already on screen and restart its timer, never restacking? | toast-check RESTACK, REMOUNT, NO COUNT |
| A3 | there is a clear or reset control | Does it clear everything it claims, with its label derived from what it clears? | read |
| A4 | data loads, can be empty, fail or be denied | Is every applicable state shipped: loading, empty, error, partial, overflow, no permission? | read |

## N - Overlays and navigation

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| N1 | there is a modal | Does the modal lock scroll, focus and clicks behind it, close on Escape, and return focus to its opener? | modal-check SCROLL, BACKDROP, ESCAPE, FOCUS, RETURN |
| N2 | there is a dropdown, popover or panel | Does every panel close by its trigger, an outside tap, Escape, and a Done on touch? | popover-check STUCK, OUTSIDE, ESCAPE, NODONE |
| N3 | there are more destinations than slots | Can the user pick which destinations the bar shows, with a menu holding every destination? | read |
| N4 | the user can leave and come back | Does coming back restore scroll, sort, filters, typed text and what was expanded, and can the screen be deep-linked? | read |
| N5 | a highlight shows the current item | Does the highlight belong to the item it marks, not to a separately measured element? | read |

## Y - Type, colour and theming

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| Y1 | there is text | Is type a role scale (heading, body, label, metadata, data), body 16px or more, figures tabular where numbers stack? | read |
| Y2 | there is text, in any theme | Does all text reach 4.5:1 (3:1 large) on its real background, in both themes? | contrast-check LOW, both schemes |
| Y3 | there is a theme or dark mode | Is the theme derived from tokens and does it cover the chrome, scrollbar included, with no undefined token? | layout-audit UNDEFINED TOKEN; contrast-check in the other theme |

## P - Performance and resilience

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| P1 | anything arrives late (image, embed, chart, font) | Does it reserve its space before it arrives, so nothing already shown moves? | read |
| P2 | there is text in a row | May the text grow longer than the mock without breaking the row, with truncated text reachable in full? | layout-audit CLIPPED, TEXT OVERLAP |

## X - Accessibility and semantics

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| X1 | anything is interactive | Are controls real buttons and links, with visible focus, labelled inputs and a sensible tab order? | focus-check; form-check |
| X2 | an element has an accessible name | Does each name state that element's own values, on the element that takes focus? | read |
| X3 | anything is placed left or right | Are spacing, alignment and borders written as start and end, with direction icons mirroring? | read |

## K - Copy

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| K1 | there is UI copy | Do buttons name their verb, errors say what to do next, and empty states say how to start? | read |

## V - Verification and state

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| V1 | state is shown (`aria-sort`, a count, a highlight) | Is every painted state derived from the one variable holding the truth, not set at the event? | read |
| V2 | a render can return early | Does everything a render owns happen on every path, including the one that draws nothing? | read |
| V3 | always | Does the layout audit pass at every width the project names, down to 375px with touch? | layout-audit at every width |

## M - Motion

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| M1 | anything moves | Does every motion explain a state change, with reduced motion keeping the change and no layout property animated? | motion-check LAYOUTPROP, NOREDUCE |
| M2 | something is opened often or from the keyboard | Does it appear in its final state with no transition? | read |
| M3 | something enters or a panel opens | Does nothing enter from `scale(0)`, and does a panel grow from the side facing its trigger? | motion-check SCALE0, ORIGIN |
| M4 | there is a transition | Does every transition name its properties, with no `transition: all` and no ease-in? | motion-check ALL, EASEIN |
| M5 | there are buttons | Does every button show a pressed state while held, with no delay? | motion-check NOPRESS |
| M6 | there are tooltips | Once one tooltip is open, does the next open at once? | explain-check SLOW NEXT |

## C - Charts and data

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| C1 | there is a chart | Was the chart chosen from the question it answers, written as a sentence? | read |
| C2 | a chart has rows, or a table beside it | Does every search, sort, filter and selection re-render the chart, legend and totals from the visible rows? | read |
| C3 | there is a chart | Does the chart hold at 0, 1 and all rows? | read (drive it to each count) |
| C4 | there is a time chart | Does it ship range presets and derive its bucket from the span, at most 40 marks? | read |
| C5 | marks can be highlighted or selected | Does a highlight show values on the mark's own outline, and does selection take many marks with a combined figure and a Clear? | read |
| C6 | values are aggregated | Does each measure aggregate with its right operation (sum, last, recomputed rate, OHLC)? | read |
| C7 | colour carries meaning | Does every value carried by colour also carry a second channel that survives greyscale? | read |
| C8 | there is an axis | Is every axis labelled with its unit and range? | read |
| C9 | there is a bar chart | Does a bar axis start at zero where the measure has a meaningful zero? | read |
| C10 | a chart is the primary view of data | Can the chart be read as a table beside it? | read |
| C11 | a chart has reference marks | Is every mark on the chart named? | read |
| C12 | a chart type has defining marks | Does the chart keep the marks that define its type through every control change? | read |
| C13 | measures are plotted side by side | Do sibling measures share one unit and one scale? | read |
| C14 | there is a readout or hover text | Does the readout report the measure actually drawn? | read |
| C15 | there is a legend | Is the legend computed from the drawn rows on every draw, the empty one included? | read |
| C16 | a legend can hide a series | Does hiding a series leave the control that brings it back? | read |
| C17 | there are series | Does every series have marks that are focusable, with a role and an accessible name stating their own values? | focus-check; read |
| C18 | an axis has an order (time, funnel, bridge) | Does the chart keep axis order while the table sorts freely, and say which order it is in? | read |
| C19 | a legend withholds marks | Is a withheld row marked in the table, excluded from the total, and counted? | read |
| C20 | there is a legend | Does each legend entry act on the marks it names? | read |
| C21 | a chart has labels in a set | Do all labels in a set share one orientation, the share inside the mark and the name outside? | layout-audit TEXT OVERLAP; read |

## G - Diagrams

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| G1 | there is a diagram | Does the diagram say something a sentence or a table could not, in a form chosen for what the reader must understand? | diagram-check TRIVIAL (advisory); read |
| G2 | there is a diagram | Does it hold at most nine boxes, twelve lines and two emphasised things? | diagram-check BUDGET, EMPHASIS |
| G3 | there are lines between boxes | Do lines run horizontally and vertically and meet each box square to its edge, clear of corners? | diagram-check DIAGONAL, CORNER |
| G4 | there are lines between boxes | Can every line be traced alone, with no shared strokes or shared ports? | diagram-check STACKED, SHARED PORT |
| G5 | there are lines between boxes | Does no line pass behind a box that is not one of its ends? | diagram-check BEHIND BOX |
| G6 | lines carry labels | Does each label sit beside its line on an opaque plate, clear of the line and of every box? | diagram-check LABEL ON LINE, LABEL GAP, PLATE UNDER BOX |
| G7 | a diagram uses more than one kind of mark | Is every kind of mark explained in a key below the drawing? | diagram-check KEY INSIDE |
| G8 | a diagram is wide | Does it keep its size on a narrow screen, scroll inside its own box, and say so? | diagram-check SHRUNK, PAGE SCROLL, CLIPPED |
| G9 | there is a diagram | Is the SVG a named figure with a title and a description, unique ids? | diagram-check NO NAME, DUP ID |
| G10 | there is a diagram | Is emphasis on one or two things, with states written as words rather than colour or motion alone? | diagram-check EMPHASIS; read |

## Beyond the numbered rules

The rows below are not rules with IDs; they are the designs and lessons the rule files carry
beside them, which a long read loses first. Their keys name their source and are never cited as
rule IDs. `validate.py` counts each group against its source, so an item added there without a
question here fails.

## CH - Chart types (chart-rules.md, Appendix CH)

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| CH-pie | a donut or pie is drawn | Is it a composition of a whole in six slices or fewer, with the total in a donut's centre? | read |
| CH-ranked-bar | the question is "which are biggest" | Is it a horizontal bar, sorted, with labels readable beside the bars? | read |
| CH-stacked-bar | a split is shown over time | Is it a stacked bar (or 100 percent stacked for share), not a pie per period? | read |
| CH-trend | one measure moves over time | Are discrete periods bars and a continuous trend a line, never a line over unordered categories? | read |
| CH-multi-line | several measures move together | Is it one multi-series line with legend toggling, and no dual y-axis? | read |
| CH-candlestick | open, high, low and close are shown | Is it a candlestick, aggregated first / max / min / last? | read |
| CH-bullet | progress against a target is shown | Is it a bullet or a progress bar with the target marked, on one shared scale, not a gauge? | read |
| CH-waterfall | a change from A to B is explained | Is it a waterfall in its own order, opening and closing bars at the ends and the steps between? | read |
| CH-funnel | a pipeline is shown | Is it a funnel that shows the drop-off between stages? | read |
| CH-gantt | things run over time and overlap | Is it a Gantt or timeline, not a table of dates? | read |
| CH-scatter | a relationship between two measures is shown | Is it a scatter (bubble for a third measure), with no line implying an order? | read |
| CH-histogram | a distribution is shown | Is it a histogram with continuous bins, or a box plot to compare distributions? | read |
| CH-kpi | a single current number is shown | Is it a KPI tile: the number, a delta naming its comparison period, and a sparkline? | read |
| CH-heatmap | hot cells are shown | Is it a heatmap or shading inside the existing table, never a 3D surface? | read |
| CH-stacked-area | a mix moves over time | Is it a stacked area (a stream only when shape alone matters), not a stacked bar with many periods? | read |
| CH-stream | a stream graph is drawn | Does it say it shows shape only, and pair with a table for the values? | read |
| CH-step | a value jumps and then holds | Is it a step line, not a straight line claiming gradual change? | read |
| CH-bump | the question is who overtook whom | Is it a bump chart of ranks, not a multi-line of amounts? | read |
| CH-diverging | values sit above and below a baseline | Is it a diverging bar around that baseline? | read |
| CH-sunburst | a hierarchy that sums is shown | Is it a sunburst (a treemap when leaves are many), never nested pies? | read |
| CH-sankey | flows from sources to outcomes are shown | Is it a Sankey whose flows balance, with any imbalance stated? | read |
| CH-tile-map | something is shown by place | Is it a tile map shading a normalised measure, not a choropleth of a raw total? | read |
| CH-radar | one subject is scored on several criteria | Is it a single-series radar that states its axis order? | read |

## CHN - Chart nevers (chart-rules.md, Appendix CH, "Never")

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| CHN-3d | there is a chart | Is nothing drawn in 3D? | read |
| CHN-dual-axis | two measures share a chart | Is there no dual y-axis? | read |
| CHN-radar-series | there is a radar | Does the radar carry one series only? | read |
| CHN-rose-radius | there is a nightingale rose | Is the radius the square root of the value, not linear? | read |
| CHN-raw-choropleth | there is a map | Does no map shade a raw total on real borders? | read |
| CHN-unbalanced-flow | there is a flow diagram or Sankey | Does what leaves the sources equal what arrives, or is the difference stated? | read |
| CHN-pie-slices | there is a pie or donut | Does it have six slices or fewer, and no pie nested in a pie? | read |
| CHN-empty-donut | there is a donut | Does the donut's centre hold the total? | read |
| CHN-truncated-bar | there is a bar chart | Does the bar axis start at zero where the measure has one (C9)? | read |
| CHN-unrelated-motion | a chart animates between data sets | Does motion only join data sets that are related? | read |

## TELL - Generated-UI tells (ui-rules.md, Appendix C, rule D6)

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| TELL-stripe | any style is written | Is there no coloured stripe down one side of any box? | layout-audit STRIPE |
| TELL-emoji | there are icons | Are icons from a real icon set or a text glyph, never emoji, in a business app? | read |
| TELL-gradient-text | there are headings or decoration | Is there no gradient on a heading or on anything that is not a chart? | read |
| TELL-glow | there is an accent or a floating panel | Is there no purple-to-blue gradient, decorative glass or heavy blur, except a frosted readout with a solid fallback? | read |
| TELL-radius | elements are rounded | Are there two radii at most, tied to element size, not one large radius on everything? | read |
| TELL-shadow | shadows are used | Do only things that genuinely float carry a shadow? | read |
| TELL-hero | it is an internal tool screen | Is the text left-aligned and dense, with no centred hero? | read |
| TELL-three-cards | there is a row of cards | Is the layout what the content needs, not three equal icon-heading-two-lines cards? | read |
| TELL-filler | there is copy | Is there no filler copy ("Powerful", "Seamless", "Effortless", "Blazing fast")? | read |

## Z - Things not to do (ui-rules.md, Appendix Z)

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| Z1 | you write or change a rule | Does every rule you wrote state a figure or a quick observation, not a judgement? | read |
| Z2 | you write a figure into rules or docs | Does each figure live in one place, with everything else pointing at it? | read |
| Z3 | you add a rule for a defect | Did you check no existing rule already covers it, and add an assertion instead of a firmer sentence? | read |
| Z4 | you write a colour | Is every colour a token, a foreground on a coloured surface included, even right after fixing one? | layout-audit UNDEFINED TOKEN; contrast-check both schemes |
| Z5 | elements share a box | Do they share one inset, set once on the box, not on each sibling? | read |
| Z6 | a box must stretch | Is it sized by its content and capped by a maximum, not pinned to two edges? | read |
| Z7 | you write an override | Does each override come after the rule it overrides at equal specificity? | read |
| Z8 | you generate text with special characters | Is every special character generated from its code point, with no escape inside a non-raw string? | read |
| Z9 | you edit files with a script | Does every scripted edit assert how many times it matched? | read |
| Z10 | you mark a "current" section on scroll | Is "current" decided where reading happens, about a third down, not by what scrolled past? | read |
| Z11 | a repaint waits on an asynchronous source | Does a second path (a timer, a return to the tab) also repaint? | read |
| Z12 | you list destinations | Is no destination inside another destination? | read |
| Z13 | you rely on a check | Did you break what each check guards and watch it fail before trusting it? | read |
| Z14 | you take a measurement | Was the surface visible, sized and settled, and was it the page you think it is? | read |
| Z15 | you reference an asset, token, font or id | Does every reference resolve? | layout-audit UNDEFINED TOKEN; read |
| Z16 | a container holds labels | Does the longest label wrap or size the container, never get clipped? | layout-audit CLIPPED |
| Z17 | something animates | Is no layout property animated, and does `getAnimations()` explain a value that matches no rule? | motion-check LAYOUTPROP |
| Z18 | you judge an animated state | Were end states tested with transitions off, and the animation where it paints? | read |
| Z19 | you test a focus behaviour | Did you take the focus away first, and confirm `document.hasFocus()`? | read |
| Z20 | a value pays something back (scrollbar, header, keyboard) | Is it read and added to, never overwritten? | modal-check SHIFT |
| Z21 | there is an interaction | Was it checked at phone width as well, by typing into things? | typing-check at 375 |
| Z22 | a rule is summarised in an always-on line | Does the short form keep the clause that separates the right reading from the cheap one? | read |
| Z23 | a sample or reference is shipped | Does the sample pass the check written for it? | read |
| Z24 | you verify a colour | Was it measured against everything it can land on, in both themes? | contrast-check both schemes |
| Z25 | you use a token | Did you find where the token is defined before using it? | layout-audit UNDEFINED TOKEN |
| Z26 | a check reports clean | Can the check say what it measured, failing when it finds no subject? | read |
| Z-diagnose | you diagnose a defect | Did you measure the thing on screen before naming the rule that caused it? | read |

## PR - Design principles (design-principles.md)

| ID | Applies when | Question (yes = holds) | Check |
|---|---|---|---|
| PR1 | a pattern is fixed or added | Is it applied on every screen that has the same thing, not only this one? | read |
| PR2 | a choice is made by hand | Is it derived in code from the data, so it cannot go stale? | read |
| PR3 | anything is shown | Does every element explain itself, with nothing the reader must guess? | read |
| PR4 | anything looks or is clickable | Does affordance match behaviour exactly, both ways? | focus-check; read |
| PR5 | the screen holds a lot | Is it dense in information with air around each piece? | read |
| PR6 | space is laid out | Is there no dead space and no runaway growth? | layout-audit; read |
| PR7 | data is displayed | Does it show the truth, partial periods and awkward figures included? | read |
| PR8 | an option is added | Was the right default chosen first, so the option is rarely needed? | read |
| PR9 | a defect is fixed | Did the fix also become a rule or an assertion? | read |
| PR9a | a control changes state | Does no control depend on state that using it destroys? | read |
| PR9b | a rule or a claim is written | Is it a figure, not a judgement? | read |
| PR9c | a figure comes from a subset | Does the figure say so where it is shown? | read |
| PR10 | work is called done | Was the rendered result looked at, not only the claim? | read |
| PR11 | two things look alike | Was the difference between them stated and kept? | read |
| PR12 | a value is displayed | Is it recomputed from what is on screen now? | read |
| PR13 | anything moves | Does motion narrate a change the user can follow without words? | motion-check; read |
