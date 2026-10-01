# Rule index

Every rule in `kz-uiuxrule`, one line each, with the category it lives in. **Generated from the rule files**
by `scripts/build-index.py` - do not edit by hand. The full text of each rule, with the failure it prevents and
the check that catches it, is in [`ui-rules.md`](../skills/kz-uiuxrule/rules/ui-rules.md) and
[`chart-rules.md`](../skills/kz-uiuxrule/rules/chart-rules.md). To find a rule by the words of your task rather
than its letter, use the keyword router, [`INDEX.md`](../skills/kz-uiuxrule/rules/INDEX.md).

78 rules. Each category links to its live wrong/right samples.

## D - Fitting the design system

Live samples: [Fitting the design system](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#d)

| ID | Rule |
|---|---|
| D1 | Find the design system first |
| D2 | No raw values where a token exists. |
| D3 | Compose from existing components first. |
| D4 | Match the surrounding UI. |
| D5 | Production-ready and precise |
| D6 | No generic AI-default styling. |

## L - Layout, spacing and the mobile shell

Live samples: [Layout, spacing and the mobile shell](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#l)

| ID | Rule |
|---|---|
| L1 | Hierarchy before decoration, and it has to survive a blur. |
| L2 | Spacing comes from a scale. |
| L3 | Spacing is a rhythm, not an interval. |
| L4 | Depth comes from light, or it is decoration. |
| L5 | Controls in a row share one height. |
| L6 | In a multi-column layout, a region that can grow without limit is bounded and scrolls. |
| L7 | Layout must survive content |
| L8 | A scrolling mobile screen is three bars and one scroller. |
| L10 | A control strip that will not fit across can fit down, and which side it takes is a measurement. |
| L9 | Count what the screen asks the user to hold at once. |

## B - Buttons and their explainers

Live samples: [Buttons and their explainers](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#b)

| ID | Rule |
|---|---|
| B1 | Icon first, label when it fits. |
| B2 | Every button is explainable, and its accessible name is not the explanation. |
| B3 | A control that cannot act is rendered as a key, not as a button - after making sure it cannot act. |
| B4 | Everything that acts answers the pointer, and it answers the same way. |

## T - Tables and columns

Live samples: [Tables and columns](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#t)

| ID | Rule |
|---|---|
| T1 | A column filter is a panel, not a single input. |
| T2 | Every column gets a filter, including computed ones. |
| T3 | Every column explains itself. |
| T4 | One mechanism per job. |

## F - Forms and input

Live samples: [Forms and input](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#f)

| ID | Rule |
|---|---|
| F1 | A required field says so before it is missed. |
| F2 | A field validates when the user has finished with it, not while they type. |
| F3 | A form is a thing being built, not a thing being submitted. |
| F4 | A field is the shape of what goes in it. |
| F5 | A digit-only field selects its value when it is entered. |
| F6 | A field that holds an amount accepts the arithmetic that produces it. |
| F7 | Every field states what it accepts, as one pattern, and that one pattern is used everywhere the value is checked. |
| F8 | Typing is never interrupted. |
| F9 | Enter moves to the next field, and only the last one submits. |

## A - Actions and feedback

Live samples: [Actions and feedback](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#a)

| ID | Rule |
|---|---|
| A1 | No silent action. |
| A2 | A repeated message counts, it does not restack. |
| A3 | A control that claims to clear, clears everything it claims, and its label is derived from what it clears. |
| A4 | Ship every applicable state |

## N - Overlays and navigation

Live samples: [Overlays and navigation](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#n)

| ID | Rule |
|---|---|
| N1 | A modal claims the whole screen, and that is four separate things. |
| N2 | A dropdown closes on choose only when the choice is single, and every panel can be closed by every route. |
| N3 | When there are more destinations than slots, the user picks which ones and in what order. |
| N5 | The mark showing where you are belongs to the thing it marks. |
| N4 | Coming back is a state, not a fresh load. |

## Y - Type, colour and theming

Live samples: [Type, colour and theming](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#y)

| ID | Rule |
|---|---|
| Y1 | Type is a role scale, not a set of sizes. |
| Y2 | Text over a variable background needs a contrast decision, and there are only two. |
| Y3 | A theme is derived from tokens, and it covers the chrome as well as the content. |

## M - Motion

Live samples: [Motion](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#y)

| ID | Rule |
|---|---|
| M1 | Motion is functional or absent. |

## P - Performance and content

Live samples: [Performance and content](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#p)

| ID | Rule |
|---|---|
| P1 | Anything that arrives late reserves its space before it arrives. |
| P2 | Text is allowed to be longer than the mock. |

## X - Accessibility and semantics

Live samples: [Accessibility and semantics](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#x)

| ID | Rule |
|---|---|
| X1 | Keyboard and semantics from the start |
| X2 | An accessible name states that element's own values, never a shared one, and sits on the element that takes focus. |
| X3 | Left and right are content, not layout. |

## K - Copy

Live samples: [Copy](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#k)

| ID | Rule |
|---|---|
| K1 | UI copy is part of the design. |

## V - Verification

Live samples: [Verification](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#v)

| ID | Rule |
|---|---|
| V1 | Paint state from the state, not at the event that changed it. |
| V2 | An early return is a path. |
| V3 | Verify the layout, not only the behaviour. |

## S - Standing rules

Live samples: [Standing rules](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#summary)

| ID | Rule |
|---|---|
| S1 | Every table ships a search bar + sort on every column + a filter per column. |
| S2 | Every destructive action is behind a confirm modal that names the target |

## C - Charts and data

Live samples: [Charts and data](https://kz-95.github.io/kz-skills/reference/ui-rules-visual.html#summary)

| ID | Rule |
|---|---|
| C1 | Choose the chart from the question, not from the data shape. |
| C2 | A chart renders what its table is showing. |
| C3 | Test every chart at 0, 1 and all rows. |
| C4 | A time chart ships range presets and derives its granularity. |
| C5 | A highlighted mark shows its values, and selection is multiple. |
| C6 | Aggregate with the right operation for the measure. |
| C7 | Never rely on colour alone. |
| C8 | Label the axis and state the unit. |
| C9 | Start a bar axis at zero. |
| C10 | Every chart can be read as a table. |
| C11 | Every mark is explained. |
| C12 | A chart type keeps the marks that define it. |
| C13 | One unit per scale. |
| C14 | The readout reports the measure the chart is plotting. |
| C15 | The legend describes the rows on screen, and is derived wherever those rows are. |
| C16 | A legend control must survive being used. |
| C17 | Every series gets marks, and every mark is reachable. |
| C18 | An ordered axis belongs to the chart, not to the table. |
| C21 | One orientation for every label in a set, and the share goes inside the mark while the name goes outside it. |
| C20 | A legend entry acts on the marks it names. |
| C19 | A row the chart is not drawing says so, and totals count only what is drawn. |
