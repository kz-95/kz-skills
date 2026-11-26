# Rule questions: the ledger

Every rule as one yes/no question, for the full path (a project, an audit, "make it production", a
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
