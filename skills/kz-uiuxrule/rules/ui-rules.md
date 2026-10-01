# UI Rules

Situation-specific rules for **building new UI**. These apply *on top of* the global
rules in [engineering-rules.md](../../kz-engrules/rules/engineering-rules.md), never instead of them.

> Modifying *existing* UI is a separate situation (L2b) and will have its own rules,
> some of which contradict these. Not written yet. See Open questions.

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

**How these tables are ordered:** by situation, not by number. A rule keeps the
number it was given when it was written, so a rule can be cited and found later; where it
sits in the list is about what it is for. A number is an identity, not a position.

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


## S: Standing rules (never scoped out)

Repeated from [engineering-rules.md](../../kz-engrules/rules/engineering-rules.md) because they apply to both
new and existing UI, and to any change that touches a table or a delete.

| # | Rule |
|---|---|
| S1 | **Every table ships a search bar + sort on every column + a filter per column.** Search spans all columns; filters narrow one column; the two combine. **A "filter" is the panel of T1: a button in the filter row that shows the column's state (`All`, `3 of 12`) and opens sort, a searchable value list with counts and, for numbers, a range - never a bare text box or a select.** An empty typed box under each header is what an unread rule produces, and it is a defect: the user has to know the exact value to type, and cannot pick, exclude or see what exists. Before building any table, read T1-T3 and Appendix A of `ui-rules.md`. The title and filter rows form one header block with one line, under the filters. Numeric sort for numbers, `localeCompare(..., { numeric: true })` for text, `aria-sort` on the active column. Show the result count and a distinct no-matches empty state. Not a follow-up, not only when asked. **Where the row order is itself content** - a sequence, a bridge, a ranking, a running balance - that order is the default sort and is restorable in one click; the columns still sort, but a table left in an arbitrary sort must not be read as the sequence (see [chart-rules.md](chart-rules.md) C18, where sorting a waterfall's steps reported the final account as `RM -325k` instead of `RM 2572k`). |
| S2 | **Every destructive action is behind a confirm modal that names the target**, with a clearly labelled cancel. Bulk deletes state the count. Never a bare click, never only `window.confirm`. |

---

## L2: Building new UI

Grouped by the job being done. A rule's letter is its category and its number is its
place within that category, so a citation says where to look: `T2` is the second rule
about tables, `V3` the third about verification. Chart rules keep their own `C` series in
[chart-rules.md](chart-rules.md), and the standing rules keep `S1` and `S2`.

Appendix U maps every old number to its new identity, permanently, so a citation written
before this change still resolves.

### D: Fitting the design system

Where the values come from, and what to build out of.

| # | Rule |
|---|---|
| D1 | **Find the design system first**: tokens, theme file, config, component library. Design into it, not beside it. |
| D2 | **No raw values where a token exists.** No hex colors, magic px, or one-off font sizes. |
| D3 | **Compose from existing components first.** New component only when nothing existing can be reasonably parameterized. |
| D4 | **Match the surrounding UI.** Before adding this screen's first table, toolbar or empty state, open the two nearest screens that already have one and copy what they do. Where they are consistent and disagree with this file, they win - this is the visual half of engineering rules 12 and 13, and it is the tie-breaker the precedence ladder points at; where they are inconsistent, this file decides. Nearby inconsistencies get fixed when obvious, safe and related (engineering rule 27), and mentioned. |
| D5 | **Production-ready and precise** unless explicitly told it is a prototype: spacing, alignment, typography, proportions, polish. This one owns no check of its own - it is the conjunction of the ones that do: the geometry audit passes at every width (V3), nothing in Appendix C's list of tells is present (D6), and every spacing step, type size, duration and contrast in it has a figure behind it (35, 74, 43, 68). A screen that fails none of those checks and still looks unfinished is a rule that has not been written yet, so say which. |
| D6 | **No generic AI-default styling.** Avoid the tells that mark a screen as machine-generated rather than designed. See Appendix C. |

### L: Layout, spacing and hierarchy

How the screen is arranged and what the eye is told to do first.

| # | Rule |
|---|---|
| L1 | **Hierarchy before decoration, and it has to survive a blur.** Establish what the eye hits first, second and third with size, weight and spacing; colour and effects come after, if at all. The test is to squint, stand back, or shrink the screen until the words stop being words - the first thing, the second thing and the major groups should still be identifiable. If everything is equally visible, nothing was prioritised, and the fix is size, weight and space, not colour. |
| L2 | **Spacing comes from a scale.** A small fixed set of steps, named once where the tokens live, and every margin, padding and gap on the screen resolves to one of them. No eyeballed one-off margins. The check is a list: collect every distinct spacing value the screen renders, and each one is a step of the scale or it is a defect - a value that appears once and matches nothing is the thing this rule exists to catch. |
| L3 | **Spacing is a rhythm, not an interval.** Related things sit closer together than unrelated ones, and a heading takes more space above it than below it because it belongs to what follows. Both are measured off the gaps the screen actually renders, so they hold where no scale exists: any screen obeying this uses more than one value, and where rule L2 applies, more than one of its steps. One value repeated everywhere is a grid, not a hierarchy: tidy, and silent about what groups with what. |
| L4 | **Depth comes from light, or it is decoration.** A shadow that lifts something has an offset and a soft blur, because it stands for a light source the whole screen shares. A zero-offset coloured halo is a glow effect wearing a shadow's name. Elevation is a small scale, applied by role - resting, raised, floating, overlay - not a value picked per component. |
| L5 | **Controls in a row share one height.** Buttons, inputs, selects and chips on the same line come from a single control-height token. See Appendix F. |
| L6 | **In a multi-column layout, a region that can grow without limit is bounded and scrolls.** Where a table, list, log or feed sits beside something else, cap it and give it an expand control, so it cannot stretch the row and strand its neighbour in dead space. A single full-width column may simply grow. See Appendix L. |
| L7 | **Layout must survive content**: long names, 0 items, 10,000 items, translated strings. Not just the mock data. |
| L8 | **A scrolling mobile screen is three bars and one scroller.** Sticky top bar, a middle that is the only thing that scrolls, an optional action toolbar, and the bottom navigation. The bars are siblings of the content, not layers over it. Where a bar must overlay, the content's bottom padding is **measured from that bar at runtime**, never typed in. A screen whose content is not a scroller - a map, a camera, a media player, a reader, a canvas - keeps the runtime measurement and the sibling relationship, and owes nothing else here. See Appendix O. |
| L10 | **A control strip that will not fit across can fit down, and which side it takes is a measurement.** Where a bar's items need more room than the width gives - a navigation, a filter rail, a toolbar - turning it through ninety degrees is the first move, not squeezing the items or hiding them behind a menu: the axis that is short is rarely the axis that is short at every width. Which side it goes to is decided by where the page's weight already is, and the light side takes it - a rail stacked against the heavy edge doubles the vertical lines the eye is already tracking. Measure rather than prefer: the reading column's own edge is usually the heavy one. Whatever the orientation, it is the same control - same items, same order, same marking of where the reader is - because a reader who learned it at one width should not have to learn it again at another. |
| L9 | **Count what the screen asks the user to hold at once.** At any one decision - a row of actions, a set of options, a level of navigation - four is comfortable, five to seven is pushing it, eight is where people start guessing. One primary action, one or two secondary, the rest behind a menu. If a decision needs a fact from the previous screen, that fact belongs on this one. |

### B: Buttons and their explainers

The controls the user presses, and how each one says what it does.

| # | Rule |
|---|---|
| B1 | **Icon first, label when it fits.** Where the project allows SVG, every button in a toolbar or an icon-capable action row leads with an icon; the text label is added when there is room and collapses when there is not - never on touch, where the label is the only disclosure (Appendix D). **Not everywhere:** a dialog footer and a form's primary/secondary row are text, because an icon beside Cancel makes two dangerous-looking options out of one. See Appendix D. |
| B2 | **Every button is explainable, and its accessible name is not the explanation.** A floating tooltip on hover devices, a tappable `[?]` on touch. The accessible name never depends on either, and that part is a safety floor: it is owed on an existing screen too, where adding tooltips across a screen that has none is not (rule B1, L2b). See Appendix D. |
| B3 | **A control that cannot act is rendered as a key, not as a button - after making sure it cannot act.** If a legend entry, chip, row or badge genuinely has nothing to act on, it loses the border, the hover state and the pressed state, and gains a word saying what it is. A button that does nothing teaches the user to distrust every other button on the page. Demoting something to a key is the cheap way out of building the interaction, so find the action first; where the control is a legend entry, [chart-rules.md](chart-rules.md) C20 says what that action is. See Appendix M and [chart-rules.md](chart-rules.md) Appendix CI. |
| B4 | **Everything that acts answers the pointer, and it answers the same way.** When the pointer is over something clickable - and when it has keyboard focus, and while it is pressed - it shows one visible change, so the user learns what is clickable by moving over it. A **halo**, a ring or soft glow drawn around the item, is the right default: it takes no layout space, so nothing shifts under the cursor; it reads on any background; and the same ring serves as the focus indicator, so it must be **visible: at least 3:1 against the surface it sits on**, in both themes. A pale tint is decoration, not a cue. This is the other half of B3: B3 takes the hover state away from what cannot act, this gives it to everything that can, and only to that. Four conditions: it appears **on state, not at rest** (at rest it is the decoration L4 rejects, which is a different thing); **every clickable thing gets the same one**, so the cue means one thing; it **never moves or resizes the item**; and on touch, where there is no hover, the press state carries it. A large target - a row, a card - is ringed as a whole, not just its text, and a round or irregular item is ringed along its own outline, never its bounding box (C5, Appendix CC). See Appendix B4. |

### T: Tables and columns

What every column owes, and what a table must not do twice.

| # | Rule |
|---|---|
| T1 | **A column filter is a panel, not a single input.** Sort, value search, multi-select value list with counts, range for numbers. It applies **live** - every tick lands immediately and the panel stays open - so there is no Cancel and no OK. A text box or single-select dropdown is not a real filter. See Appendix A. |
| T2 | **Every column gets a filter, including computed ones.** A value that exists only inside a formatter cannot be sorted or filtered, so materialise it onto the row. See Appendix A. |
| T3 | **Every column explains itself.** Each column header carries a one-line explainer: a tooltip on pointer devices, a tappable `[?]` on touch. A column whose meaning is obvious to the person who built it is rarely obvious to the person reading it. See Appendix A. |
| T4 | **One mechanism per job.** When a general mechanism exists, a second bespoke one beside it is a defect, not a convenience. A dimension worth filtering is a column, filtered in the panel like every other column, rather than a dropdown in the toolbar that behaves differently. See Appendix M. |

### F: Forms and input

What a form asks for, when it checks, and what it keeps.

| # | Rule |
|---|---|
| F1 | **A required field says so before it is missed.** Mark it while the form is still empty, nudge it when it is left empty on the way out, and on submit refuse, say how many are missing, and put the cursor in the first one. Mark the optional ones too. See Appendix P. |
| F2 | **A field validates when the user has finished with it, not while they type.** Check on blur, clear on input, and pick the input type that brings the right keyboard and the right autofill on a phone. Rule F1 covers what a required field does, this covers what every other field does, and rule F3 covers what the form as a whole keeps. |
| F3 | **A form is a thing being built, not a thing being submitted.** Work with more than a few fields in it keeps a draft, so closing the tab does not cost the afternoon, and a sheet or modal holding unsaved changes asks before it closes. A flow with steps says which step this is and lets the user go back a step without losing the one they are on. Where several fields are wrong at once, the summary is a list of links that land on each field, not a paragraph naming them. And any action that destroys something offers a way back for as long as it plausibly could - undo beside the confirmation, not instead of it (S2, Appendix B). |
| F4 | **A field is the shape of what goes in it.** Content that is written in lines - a message, a note, an address, a template with placeholders - gets a field that is more than one line high and **grows as it is typed**, to a cap, after which it scrolls inside itself. A one-line box for that content scrolls sideways instead, so the writer cannot see the sentence they are writing, and on a phone, where the keyboard already owns half the screen, they can see about four words of their own message. The same shape applies to anything echoing it: a preview of a multi-line value wraps, it does not truncate. And in a multi-line field **Enter inserts a line, it does not submit** - a message template whose Enter key sends the form cannot contain a paragraph break at all, which is a rule enforced by accident rather than decided. Where the field sits below the fold on a phone, it and its primary action stay above the keyboard (Appendix O). |
| F5 | **A digit-only field selects its value when it is entered.** If the field accepts nothing but digits (and, for an amount, the arithmetic of F6) - a quantity, a price, a percentage, a year, a count, a phone or card number - the user is typing a different number, not amending this one, so entering it selects what is there and the first keystroke replaces it. Without that, every edit begins with clearing: tap, land the caret somewhere inside `1200`, four backspaces. On a phone the caret lands where the fingertip did rather than where it was aimed, so the clearing is a guess too. Select from every route - tap, Tab, or focus moved there by a failed submit - because a field that selects on Tab but not on tap is worse than one that never does: the behaviour is now unpredictable. A second tap inside the selection puts a caret back, since that tap said the value is being amended after all. The condition is the field's own restriction, not a guess about intent: where a field also accepts letters, this rule says nothing. See Appendix P. |
| F6 | **A field that holds an amount accepts the arithmetic that produces it.** A quantity, a price, a percentage, a count, a length: the number is often the answer to a sum the user is holding in their head - `12*24` cartons, `1850-150` after a discount, `(3+2)*4` rooms. The field takes digits, a decimal point, `+ - * /` and brackets, and nothing else - the point even where the result must be whole, because `2.5*4` is `10` and a field that drops the point turns `0.1+0.2` into `01+02` without a word; it shows the result beside the expression while it is typed, and **on commit** (Enter, Tab, leaving the field) replaces the expression with the result. Without it the user leaves for a calculator, carries the answer back by hand, and a digit-only field that silently drops the `+` turns `1200+50` into `120050` - a wrong number with no error. An expression that does not resolve - unclosed bracket, trailing operator, divide by zero - or whose result breaks the field's own limits (a fraction in a whole-number field, a negative where none is allowed) keeps the text and says which, never rounds or clamps silently. It is computed by a parser that knows only those symbols, **never by executing the text as code**. **Not for identifiers or secrets:** a phone, card or account number, a postcode, a PIN, a one-time code, a password - there `+` and `-` are part of the value, or the value must reach the server exactly as typed. See Appendix P. |
| F7 | **Every field states what it accepts, as one pattern, and that one pattern is used everywhere the value is checked.** Two halves: characters that can never be part of a valid value are refused as they are typed (a letter in a quantity), and the whole value is checked against the shape it must have once the user has finished (F2) - five digits for a five-digit postcode, one `@` with a dot after it for an email. The pattern is **anchored at both ends**: an unanchored `\d{5}` passes `123456` and `ab12345`. It is written once and used by the field, the error message and the server, because two copies disagree and the server's is the one the user never sees until the save fails. **Refuse only what can never be valid, and normalise what is merely formatted** - spaces in a card number, dashes in a phone number - rather than rejecting it: a name pattern stricter than "not empty" rejects `O'Brien`, `Nguyễn` and `Ng`, and an email pattern stricter than the one below rejects `ana+quotes@shop.my`. Shape is all a pattern can check: a range, a checksum and a real calendar date are checked separately. An amount field (F6) checks the result, not the expression. See Appendix P. |
| F8 | **Typing is never interrupted.** While someone types into a field, nothing their keystrokes cause may replace the field, move its caret, move it on the screen, or zoom the page - each one breaks the word being typed, and on a phone the first also closes the keyboard. Four causes: **the field is rebuilt** - an update redraws the region that holds it, so the element being typed into is thrown away and a new one put in its place; update what the typing changed, never the region around the field. **The value is written back** - set from state on every keystroke, late or after formatting, it sends the caret to the end; write it only when it differs, and put the caret back after the characters the user typed. **Something above it changes height** - a count, a chart, a list of matches, a message; what reacts to typing goes below or beside the field or into reserved space, or the scroll is corrected by the distance the field moved, and nothing scrolls the page on input. **The page zooms** - a field under the 16px floor on a phone (Appendix Q). The keyboard opening resizes the viewport (Appendix O), so a resize handler that redraws the page redraws the field as well. Check: `typing-check.js` types into the middle of every field on the page. See Appendix P. |
| F9 | **Enter moves to the next field, and only the last one submits.** In a form of several single-line fields, Enter takes the user to the next field, as Tab does; only Enter in the **last** field submits. Without it Enter submits a half-filled form: the user presses the key they have always used to finish a field, and either loses the form to a submit full of errors or saves a partial record. A field that is not single-line keeps its own Enter: a textarea inserts a line (F4), a select or an open suggestion list chooses, a button activates; and Enter during an IME composition is the composition's, not the form's. **The exception is a form that cannot be undone** - it deletes, charges, sends to someone, or is sensitive: there Enter in the last field does not submit but lands on the confirming button, which names what will happen (S2), and Enter on that button confirms. On a phone, `enterkeyhint="next"` on every field but the last and `"done"` or `"go"` on the last makes the keyboard say what Enter will do. Check: `typing-check.js` presses Enter in each field. See Appendix P. |

### A: Actions and feedback

What happens after a press, and how it is reported.

| # | Rule |
|---|---|
| A1 | **No silent action.** Every action that changes state, takes time, or can fail tells the user what happened. Progress on the control, outcome in a toast. See Appendix B. |
| A2 | **A repeated message counts, it does not restack.** The same toast arriving again keeps the node that is already on screen, adds a count and restarts its timer. Removing and re-adding it replays the entry animation and reflows the stack, which reads as a broken UI. See Appendix B. |
| A3 | **A control that claims to clear, clears everything it claims, and its label is derived from what it clears.** "Clear filters" that leaves a hidden series hidden, a measure unticked and four marks selected is rule A1 in reverse: an action reporting more than it did. See Appendix M. |
| A4 | **Ship every applicable state**: loading, empty, error, partial, overflow, no-permission. The state you skip is the one the user hits first. |

### N: Overlays and navigation

What claims the screen, what dismisses it, and what survives coming back.

| # | Rule |
|---|---|
| N1 | **A modal claims the whole screen, and that is four separate things.** Nothing behind it scrolls, takes focus, or takes a click, and Escape closes it with focus returning to whatever opened it. `<dialog>.showModal()` gives you three of the four; the background scroll is the one it leaves, and the one that ships. A non-modal popover is the opposite contract and must lock nothing. See Appendix N. |
| N2 | **A dropdown closes on choose only when the choice is single, and every panel can be closed by every route.** Multi-select and editable popovers stay open until the user dismisses them, so the ways to dismiss one are not optional: **tapping its own trigger again closes it** (a trigger that only opens is a trap: nothing else may be reachable, and a phone has no Escape), an outside tap closes it, Escape closes it and returns focus to the trigger, and on touch a visible **Done** at 44px, because a panel can cover its own trigger. Do not open the on-screen keyboard over a panel on touch by auto-focusing its search. Check: `popover-check.js` opens every panel and closes it each way. See Appendix J. |
| N3 | **When there are more destinations than slots, the user picks which ones and in what order.** Four or five slots plus a menu holding **every** destination, not just the leftovers. The bar and the menu do different jobs, and it is the menu being complete that makes a five slot bar safe. **The complete menu is the rule; the editable arrangement is not.** Where the destination set is large and which destinations matter differs by user, the arrangement becomes a preference, edited by dragging, with a keyboard route to the same thing. Where every user has the same job - a fixed-role internal tool - fixed slots plus the complete menu is the whole rule, and building the editor is two weeks spent on a preference nobody sets. See Appendix O. |
| N5 | **The mark showing where you are belongs to the thing it marks.** A highlight built as a separate element - a sliding pill, an underline, a bar positioned by `left` and `width` from a measurement - is a second thing that has to agree with the first, and it drifts: it is measured before the font loads and sits a few pixels off forever, it is not recomputed when the container scrolls or the window resizes, it is measured against the wrong offset parent, or it animates to where the item *was*. The item's own background, border or weight cannot drift, because there is nothing to keep in sync. Where a moving indicator is genuinely wanted, it is derived from the marked element's box on every paint, and the paint runs on resize, on the container's own scroll, and after fonts settle - not once at load. This is rule T4 at the scale of a single control: one mechanism, not two that must be reconciled. See Appendix W. |
| N4 | **Coming back is a state, not a fresh load.** Where the user was is part of what they were doing: the scroll position, the sort, the filters in the panel, what they had typed, what was expanded. Going forward and returning restores all of it, and any screen worth arriving at can be arrived at directly - addressable, shareable, survivable across a reload. **The address has three jobs and they do not mix**: the path names the thing, the query names what is selected inside it, and the fragment names the part being read - one record, the variant chosen within it, at the section being read. A selection that lives only in memory cannot be sent to anyone, and the test is whether a link pasted to a colleague opens on what the sender was looking at rather than on the default. Nothing resets the way back without saying so. See Appendix T. |

### Y: Type, colour and theming

The figures behind text and surfaces.

| # | Rule |
|---|---|
| Y1 | **Type is a role scale, not a set of sizes.** Name the roles the screen needs - heading, body, label, metadata, data - and give each one size, weight and spacing that tell it apart at a glance from the one next to it. Body prose stays between 45 and 75 characters per line and floors at 16px, and so does any input the user can focus on a phone - below that the browser zooms the page as the field takes focus and moves the form out from under the finger. Numbers that sit in a column, a total or a readout use tabular figures, or the digits shift under their own sort. See Appendix Q. |
| Y2 | **Text over a variable background needs a contrast decision, and there are only two.** Either raise the contrast of the text or the background, or give the text an outline, shadow or backing. A label that can land on a filled mark, an image or a chart series gets one of them, chosen deliberately. Muted grey for something that names a thing is the default that fails both ways: it is chrome colour doing content work. **The pass mark is a number, and the numbers live in Appendix Q** - one place, so they cannot drift apart. On a coloured surface, tint secondary text from that hue rather than reaching for grey. See Appendix Q. |
| Y3 | **A theme is derived from tokens, and it covers the chrome as well as the content.** Never a second hand-written stylesheet for dark mode. Scrollbar, selection, caret, focus ring, placeholder, autofill and form controls all take theme tokens - and the scrollbar is the one that is missed, on every long page, which makes it the thing to check before calling a theme finished. See Appendix E. |

### M: Motion

When movement is doing work.

| # | Rule |
|---|---|
| M1 | **Motion is functional or absent.** Transitions explain a state change (enter, exit, reorder); respect `prefers-reduced-motion`, and respecting it means an alternative that still shows the state change, never a blanket `0.01ms` that deletes the feedback with the animation. Decorative animation is skipped. **Duration comes from the distance, and the bands live in Appendix Q.** Exit faster than entrance, decelerate on arrival, and move or fade rather than animating a property that forces the layout to be recomputed. See Appendix Q. |

### P: Performance and content

What arrives late, and content that is bigger than the mock.

| # | Rule |
|---|---|
| P1 | **Anything that arrives late reserves its space before it arrives.** An image, an embed, a chart, a font: give it its box up front - a declared ratio, explicit dimensions, a skeleton of the right size - so nothing already read jumps out from under the pointer. What is off screen loads when it nears, text renders in a fallback face rather than waiting, and a list past a few hundred rows renders what is in view while reserving the height of the rest. Handlers on scroll, resize and typing are throttled or debounced, and a loop that reads layout then writes it batches the reads first. See Appendix R. |
| P2 | **Text is allowed to be longer than the mock.** The text in a row is the part that may shrink, and most layout engines will not shrink it below its content width until told so; long words break, truncated text stays reachable in full, and a translated label wants roughly a third more room than the English one. Dates, numbers and currencies come from the platform's locale formatter rather than being assembled by hand, and anything that says "1 item" takes its plural from the count. |

### X: Accessibility and language

The obligations that never scope out.

| # | Rule |
|---|---|
| X1 | **Keyboard and semantics from the start**: real `<button>`/`<a>`, visible focus, labels tied to inputs, sensible tab order. Retrofitting a11y means rewriting the markup. |
| X2 | **An accessible name states that element's own values, never a shared one, and sits on the element that takes focus.** Geometry is shared between rows; values are not. An `aria-label` built from the scale maximum, the group total or a sibling's figure is a confident lie told only to the people who cannot see the screen - and a perfect description on an inner element nobody can focus is not a name at all. See Appendix M. |
| X3 | **Left and right are content, not layout.** Spacing, alignment and borders are expressed as start and end, so a right-to-left language mirrors the interface instead of breaking it. Icons that mean direction - a back arrow, a next chevron, a progress bar - mirror with it; icons that mean a thing - a clock, a logo, a checkmark - do not. Anything hard-coded to one side is a rewrite the first time the product is translated. |

### K: Copy

The words on the screen.

| # | Rule |
|---|---|
| K1 | **UI copy is part of the design.** Buttons name the verb, errors say what to do next, empty states say how to start. No "Something went wrong" when the cause is known. |

### V: Verification

What has to be true on every path, and what is checked before done.

| # | Rule |
|---|---|
| V1 | **Paint state from the state, not at the event that changed it.** `aria-sort`, `aria-pressed`, a caption, a count, a highlight: they are derived from the one variable that holds the truth, wherever that derivation happens for this stack - inside the draw in an imperative renderer, in the render from props or state in a declarative one. What is forbidden is assigning them from the handler that changed the state, because every other path to that state - a reset, a keyboard shortcut, a restore from the address - then leaves the old rendering behind. **The test:** if the state can be changed by more than one path, is the rendering done by all of them, or once where they all end up? See Appendix M. |
| V2 | **An early return is a path.** Whatever a render owns has to happen on every path through it, including the one that draws nothing. Shared state that several parts read - a selection, a readout, a count, a highlight - is maintained in the one place they all pass through, not in each part where an empty guard can return before it. Rule V1 says where a rendering is derived from; this says which paths have to reach it. **The test:** does the empty path leave the screen as true as the path that draws? See Appendix M. |
| V3 | **Verify the layout, not only the behaviour.** Behaviour tests pass while the layout silently breaks: overflow, collisions, clipped text. Run the layout audit at every width the README names, the narrowest of them being the narrowest the project supports, before saying done. That pass is not a later one: it is where this entire class of defect hides, and every defect listed in Appendix K was invisible at the comfortable width. See Appendix K. |

## Open questions

- **L2b: modifying existing UI** is unwritten. Until it exists, these are the rules that
  go wrong on an existing screen, so nobody has to guess which half is unsafe:
  **D1, D2, L2** (do not migrate the surrounding screen to a design system it is not on;
  match what is there, even where it is worse), **D3** (do not rebuild a component to
  compose it properly as a side effect of a small change), **D4** (still true, and it
  outranks the others - the existing pattern wins), **D5** (the surrounding polish level
  is the bar, not this file's), **D6, B1, L5, T3** (do not restyle controls or add
  explainers across a screen that does not have them; a half-converted screen is worse
  than a consistent old one). Everything else - the safety floor, S1, S2, the accessibility
  and truthfulness rules - applies unchanged to an edit.
- No rules yet for dashboards or data-dense screens specifically. Forms are now covered
  across rules F1, F2 and F3; what is untested is whether those three read as one thing
  or as three rules that happen to be about forms.
- Rules Y1, P1 and L9 arrived from outside this project's own defects, unlike every rule
  before them (principle 9). They are held to the same standard as the rest, so the first
  one that a real screen contradicts gets rewritten rather than defended.

---

## Appendix A: The standard table pattern (S1)

The reference implementation lives in `ui-rules-visual.html` (the reference page and the browser checks in the project this corpus came from (not carried in this package)).
Anatomy, top to bottom:

```
+-----------------------------------------------------+
| [ Search all columns...        ] [Clear] ( 5 items )|  <- toolbar
+-----------------------------------------------------+
| ITEM ^          | QTY            | SITE             |  <- sortable labels
| [All        v]  | [All       v]  | [All        v]   |  <- filter panel triggers
+-----------------------------------------------------+
| Sand (m3)       | 35             | Site 1           |
| Rebar 12mm      | 90             | Site 2           |
+-----------------------------------------------------+
```

Required parts:

| Part | Behavior |
|---|---|
| Search bar | Spans every column, substring, case-insensitive. Highlights the hit with `<mark>`. |
| Clear | Resets search **and** every column filter in one action. |
| Result count | `5 items` when unfiltered, `2 of 5` when narrowed. `aria-live="polite"`. |
| Column label | Click or Enter/Space to sort; click again to reverse. `tabindex="0"` on the header. |
| Sort indicator | ^ / v on the active column only, plus `aria-sort="ascending" \| "descending" \| "none"`. |
| Column filter | One filter panel per column: sort, value search, multi-select value list, and a range for numbers. Narrows that column only, combines with the table search (AND). See below. |
| No-matches state | Distinct from "no data yet": says *No matching items* and how to widen. |

Sort comparators:

- Numbers: `a - b`. Never string-compare a number column.
- Text: `String(a).localeCompare(String(b), undefined, { numeric: true })`, this is what
  puts `Site 2` before `Site 10`. Plain `<` puts `Site 10` first, the classic
  wrong-looking table.

### Layout requirement

Filters go on **their own row beneath the header row** (a `filters` row inside `thead`),
never inline beside the column label. Sharing a line makes the label and the input
compete for a short column's width, wraps them unpredictably, and lets the sort arrow
collide with the input. The header row stays purely scannable; the filter row is a
separate band **inside the same header block**. How the two rows meet is stated here,
because left unstated every builder guesses, and the guess is wrong the same way each time.

- **The title row and the filter row are one header block, with no line between them.**
  The only header line sits under the filter row, separating the header from the data. A
  line between a title and its own filter cuts the two apart and reads as a broken table.
- **A filter keeps a visible gap from every line: at least 4px** between its box and any
  border above or below it. Never zero top padding on a filter row that has a border above.
- **Why it keeps happening.** Every cell is styled with a bottom border; then the filter
  row's top padding is zeroed to make it "belong" to its title - which glues the boxes to
  the line that was just drawn under that title.
- **Reference CSS** (the filter row's cells may be `td` or `th`):

```
thead tr:first-child th { border-bottom: 0; padding-bottom: 4px; }
tr.filters th, tr.filters td { padding-top: 0; border-bottom: 1px solid <line>; }
```

- **Check it by measuring, not looking.** `table-check.js` FILTERGAP reads computed style
  and layout. A 0px gap is invisible in a scaled-down screenshot, which is why it is missed.

### The filter is a panel, not a single input

**A per-column text box or single-select dropdown is not a real filter.** It can express
exactly one value, and the questions people actually ask are "these three, not that one"
and "everything except the cancelled ones". The reference behaviour is the spreadsheet
filter (Excel, Google Sheets): one panel per column, opened from a control in the filter
row, containing everything that column can do.

```
  [ All              v ]   <- trigger in the filter row, shows current state
  +-------------------------------+
  | Sort A to Z                   |   <- same wording on every column
  | Sort Z to A                   |
  +-------------------------------+
  | [min]  to  [max]              |   <- numeric or date columns only
  +-------------------------------+
  | [ Search values...          ] |   <- searches the VALUE LIST, not the table
  | Select all - Clear    3 of 12 |
  +-------------------------------+
  | [x] Renovation            (4) |   <- multi-select, with occurrence counts
  | [ ] Maintenance           (2) |
  | [x] Fit-out               (7) |
  |     ... scrolls ...           |
  +-------------------------------+
  |   3 of 12 selected            |   <- applies live; Escape closes
  +-------------------------------+
```

**Required parts**

| Part | Behaviour |
|---|---|
| Trigger | Sits in the filter row under the column label. Caption shows the state: `All`, `3 of 12`, or `300 to max`. Visibly marked when the column is filtered. |
| Sort | **`Sort A to Z` and `Sort Z to A` on every column**, numeric or not. It is the same operation and one wording keeps the panel predictable; the comparator underneath still sorts numbers numerically. Sorting from the panel sets `aria-sort` on the header exactly as clicking the header does. |
| Range | Min and max pair, for numeric and date columns only. Never a substring box on a number. |
| Value search | Searches **the list of values inside the panel**, not the table. This is what makes a 500-value column usable. |
| Value list | Multi-select checkboxes of the distinct values, with the occurrence count per value. Scrolls; the panel does not grow. |
| Select all / Clear | Act on the **currently searched subset**, not the whole list. Search "Site 1", click Select all, and you have ticked only the matching ones. |
| Counter | Live `3 of 12` while ticking, before anything is applied. |
| Applying | **Live.** Every tick, range edit and Select all applies immediately: the table, the chart and the trigger caption all update while the panel stays open. No Cancel or OK. |

**Rules that fall out of this**

- **Everything ticked means no filter.** Store nothing in that case, so the column does
  not read as filtered when it is not.
- **Live apply, not Cancel/OK.** The user sees the result while they are still choosing,
  which is the point of a value list: tick, see the chart move, tick another. A
  confirmation step makes the panel feel like a form and hides the consequence until
  after the decision.
  - The cost is no single-step undo of a mis-tick. It is acceptable here because every
    action is directly reversible: tick it back, use Clear, or Escape.
  - It would **not** be acceptable for anything destructive or expensive. Live apply
    suits a local, reversible, instantly visible change. A filter that triggers a slow
    server query should debounce, and one that costs money or deletes something keeps its
    confirmation (S2).
  - Escape and clicking outside close the panel; they do not revert, because there is
    nothing pending to revert.
- **Nothing ticked is a legitimate state** and shows the no-matches empty state. It is not
  an error.
- **Build the value list from the data**, sorted with `localeCompare(..., {numeric:true})`
  so `S2` precedes `S10`. Never hardcode it: a new value would silently be unfilterable.
- **Exact match on a ticked value**, never substring. Ticking `Site 1` must not also
  match `Site 10`, which is precisely what a text box gets wrong.
- **Multi-select is the default.** Single-select is only correct when the column is
  genuinely exclusive, which is rarer than it looks.
- The panel is a `role="dialog"`; the trigger carries `aria-haspopup="dialog"` and
  `aria-expanded`.

### Every column explains itself (rule T3)

Column labels are abbreviated by necessity: `Qty`, `Share`, `Chg`, `Collected`. The
person who built the table knows that `Share` is a percentage of all revenue rather than
of the filtered view. Nobody else does, and they will not ask.

Give every column a one-line explainer, delivered the same way as a button explainer
(Appendix D):

| Context | Mechanism |
|---|---|
| Pointer device (`hover: hover`) | Tooltip on the header, after a short delay and on keyboard focus |
| Touch (`hover: none`) | A small `[?]` beside the label, tapped to open a popover |

Implementation notes that are easy to get wrong:

- **The `[?]` must not sort the column.** The header is the sort control, so the click
  handler has to ignore clicks that land on the `[?]`:
  `if (e.target.closest('.help')) { return; }`
- **Headers are generated, so the explainers are too.** Wiring `[?]` buttons once at page
  load misses every table built afterwards, and every table rebuilt after a data change.
  Wire them when the header renders.
- **Say what the column means, not what it is called.** "Share" explained as "the share"
  is worse than nothing. Name the denominator, the unit, the cut-off, whatever the reader
  cannot infer.
- **Explain the aggregation where it is surprising.** A `Close` column whose multi-row
  selection takes the last value rather than a sum should say so.

### The value list is part of the column (rules T1, T2)

Two defects found in the shared filter panel, both invisible until someone looked at a
column whose values are not plain text:

- **The list sorts the way the column sorts.** A numeric column listed `-125.3` above
  `-5.7` because the list sorted as strings while the table sorted as numbers, so one
  column showed two contradictory ascending orders at the same time.
- **The list shows what the cell shows** - derived by running the column's own formatter,
  not by writing the labels out again - **and no two entries may read the same.** A
  column that renders several raw values as one word gave two tick boxes both reading
  "total". Where labels collide, the value comes back to separate them: `total (0)` and
  `total (2600)`.

The test for both: read the list beside the column and ask whether every row of it is
distinguishable, and in the order the column itself would put them.

And a third, from the same family: **a column formats one way down its whole length,
footer included.** Cells reading `742000` above a footer reading `3,944,000` look like two
different quantities in one column, which is the same defect as two vocabularies in one
filter list.

### No column is exempt (rule T2)

A column with no filter control is a hole in the row, and the user reads it as broken
before they read it as deliberate. The usual excuse is that the value is computed, for
example a percentage share derived from a total. That is an implementation detail, not a
reason:

- **Materialise computed values onto the row** when the data is built, rather than
  producing them inside the cell formatter. A value that exists only in the formatter
  cannot be sorted, filtered, searched, or exported, and each of those will be asked for.
- Keep the formatter for **presentation only** (`47.6` -> `47.6%`). The row holds the
  number; the formatter holds the suffix.
- If a computed value genuinely depends on the current filter, it cannot also be a filter
  input without circularity. Materialise it against the **full** data set, and let the
  footer show what the filtered subset comes to.

### Totals come from source values, never from displayed ones

Summing five percentages each rounded to one decimal gives `100.1%`. Compute the total
from the underlying amounts and round once, at the end:

```js
// wrong: adds up already-rounded parts
rows.reduce((a, r) => a + r.share, 0)          // -> 100.1%

// right: totals the source, rounds once
(shown / grand * 100).toFixed(1)               // -> 100.0%
```

The same applies to currency with cents, durations, and any aggregate over rounded
values. A footer that does not agree with its own column is the fastest way to lose
trust in a table.

A footer over a **filtered** view must total the filtered rows, not the whole data set,
and must not claim `100%` when only part of the data is shown.

**When a plain control is still acceptable:** a table with one or two columns and a
handful of rows, where a panel is heavier than the problem. If the table has enough data
to be worth filtering at all, it is worth the panel.


## Appendix B - Action feedback (rule A1)

**The rule is not "a toast on every click."** It is: an action must never leave the user
guessing. Pick the lightest feedback that answers *did that work?*

| Situation | Feedback | Toast? |
|---|---|---|
| Result is visible on screen immediately (sort a column, type in a filter, expand a row, switch a tab) | The changed UI itself | **No** - a toast here double-reports and becomes noise |
| Action takes time (save, refresh, upload, submit, load more) | Spinner **on the triggering control** + `aria-busy="true"` + disable it, and a skeleton in the region being replaced | Only on the outcome |
| Action succeeded but its result is off-screen or invisible (saved, copied, emailed, exported, synced) | Toast | **Yes** |
| Action failed | Toast saying what failed and what to do next, longer dismiss timeout | **Yes** |
| Action is destructive | Confirm modal first (S2), then a success toast carrying **Undo** | **Yes, with Undo** |
| Action was cancelled | Brief toast confirming nothing happened | Yes, short |

Requirements:

- **Progress goes on the control, not only in a toast.** A user who clicked *Refresh*
  looks at the Refresh button. Replace its label with a spinner + present-tense verb
  ("Refreshing"), set `aria-busy="true"`, and block re-entry so it cannot be double-fired.
- **The region being reloaded shows a skeleton of its real shape**, not a centred spinner
  over empty space. See rule A4.
- **Toasts are `role="status"` with `aria-live="polite"`** so screen readers announce them.
  Errors stay longer than successes. Every toast has a manual dismiss.

### The same message twice (rule A2)

An action that can be fired repeatedly - a submit with a field still empty, a toggle, a
retry - will produce the same toast again while the first one is still on screen. The
obvious implementation removes the old node and appends a new one, and it looks broken:
the entry animation replays, the stack reflows, and to a user it reads as the toast
flickering or jumping while nothing is actually wrong.

**Keep the node that is already there.** Give it a count, restart its dismiss timer, and
move nothing:

    +----------------------------------------+
    | (!) 2 fields still need filling.  x3 [x]|
    +----------------------------------------+

- Match on the message **and the kind**: an error and a success that happen to share a
  string are not the same event.
- **Never merge an undoable toast.** Each undo belongs to its own action, and a merged
  one would silently drop the earlier undo.
- One function owns how long a toast lives, so restarting the timer cannot drift away
  from setting it. Two copies of `3500` is how a restarted toast ends up outliving a new
  one.
- **The dismiss is a target, not a character.** This one was a 10px glyph, and on touch a
  toast cannot grow to a 44px row without becoming a panel - so the padding grows through
  a pseudo-element and the glyph stays where it is. The audit at 375px with touch is what
  found it; nothing about it looks wrong on a desktop screenshot.
- The count is the honest report: three attempts happened, and the user can see that they
  did without three boxes sliding past.
- **Destructive success carries Undo** where the operation is reversible. Undo in a toast
  is worth more than a second confirmation dialog.
- **Never a bare `alert()`**, and never a success message that says only "Success" - name
  what succeeded, as in rule K1.

### Appearance and stacking

- **No coloured left stripe on a card.** A 3-4px accent border down the left edge of a
  white toast or alert is the single most recognisable generated-UI tell. Carry status
  with a small glyph (check / cross / spinner) and, for errors only, the border colour of
  the whole card. Keep all four borders the same width.
- **Shadow stays soft.** A heavy drop shadow on a floating card reads as a template.
- **A repeated action updates the toast it already has** - a count and a restarted timer
  on the node already on screen (rule A2). It neither stacks a second copy nor removes and
  re-adds the first.
- **Cap the stack at three.** Beyond that, drop the oldest. A column of five toasts is a
  failure of the design, not a feature.
- **Every toast has a manual dismiss** and an auto-timeout: roughly 3.5s for a success,
  7s when it carries Undo, 8s or manual-only for an error.

### Position

The position is the project's to choose; what is not negotiable is that it is the **same
position everywhere in the app**, that it is anchored to an edge and enters from that edge,
that it never covers the thing it is reporting on, and that it never swallows a click meant
for what is underneath. A corner, a top-centre or a bottom-centre all satisfy that. What
does not is a position that moves between screens, or one floating dead-centre over the
content it is
reporting on.

- Enter from the edge they are anchored to: a top toast slides **down**, a bottom toast
  slides **up**. The motion says where it came from (rule M1).
- Stack in reading order from that edge, newest nearest the edge.
- The container is `pointer-events: none` with the toasts themselves `pointer-events: auto`,
  so a full-width strip never swallows clicks on the page beneath.
- Bottom-centre collides with mobile browser chrome and floating action buttons; top-centre
  collides with a sticky header. Pick the one this app does not already occupy, and use the
  same one everywhere.

Reference implementation: the table toolbar in
`ui-rules-visual.html` (the reference page and the browser checks in the project this corpus came from (not carried in this package)) - *Clear* toasts, *Refresh* shows an in-button
spinner plus row skeletons and then toasts its outcome, and the delete modals toast with
Undo. Sorting and filtering deliberately stay silent.

---

## Appendix C - Generated-UI tells (rule D6)

Patterns that make a screen read as machine-produced rather than designed. None is
forbidden by physics; all of them are defaults that nobody chose.

| Tell | Instead |
|---|---|
| Coloured left stripe on a white card (toast, alert, callout) | A small status glyph; colour the whole border only for errors |
| Emoji as UI iconography in a business app | A real icon set, or a text glyph |
| Gradient headings, or a gradient on anything that is not a chart | Flat type; hierarchy from size and weight (rule L1) |
| Purple-to-blue accent gradient, decorative glassmorphism, heavy `blur()` | The project's own accent token. **Exception:** a panel that genuinely floats over content it must not hide, such as a chart readout, may be frosted so the marks underneath stay visible. That is glass doing a job, not glass as styling. Keep a solid fallback under `@supports`, because unreadable text is worse than a covered mark. |
| Rounded-everything at the same large radius on every element | Two radii at most, tied to element size |
| A shadow on every surface | Shadow only on things that genuinely float |
| Centred hero text on an internal tool screen | Left-aligned, dense, scannable |
| Three evenly-spaced feature cards with an icon, a heading and two lines each | Whatever the actual content needs |
| Filler copy: "Powerful", "Seamless", "Effortless", "Blazing fast" | Say the specific thing (rule K1) |

The test: **would someone have chosen this, or is it just what appeared?** If the second,
it is a tell. This matters most on the surfaces a user sees every day, where the default
look quietly says the screen was not thought about.

---

## Appendix D - Buttons, tooltips and the [?] (rules B1, B2)

### Anatomy

Icon **always**, label **when it fits**, accessible name **unconditionally**.

```
wide    [ [save]  Save ]        icon + label
narrow  [ [save] ]              label collapses, icon carries it
always  aria-label="Save changes"
```

- Icons are inline SVG from one set, sized 16px at `stroke-width` ~1.75, inheriting
  `currentColor` so they follow the theme and the button state. Never a PNG, never an
  emoji (rule D6).
- The label collapses via a breakpoint, **not** by being deleted from the markup - it
  stays in the DOM, visually hidden, so it still reaches assistive tech.
- **Collapse the label by measurement, not by breakpoint.** A viewport breakpoint is the
  wrong instrument: the control lives in a pane, and a 1400px window can hold a 360px
  pane. Render with the full label, then compact only if the row would overflow.

```js
function fitToolbars() {
  document.querySelectorAll('.tablebar').forEach(function (bar) {
    bar.classList.remove('compact');
    if (bar.scrollWidth > bar.clientWidth + 1) { bar.classList.add('compact'); }
  });
}
new ResizeObserver(fitToolbars).observe(pane);
```

  Labels stay whenever there is room, drop the moment there is not, and come back when
  the pane grows. A container query is the CSS-only approximation and still guesses a
  threshold.
- **A toolbar wraps only as a last resort.** Labels collapse first. A control row breaking
  onto a second line reads as a layout failure, not as a responsive decision.
- **Match the button text size to the field beside it.** A button inheriting the 16px body
  size looks oversized next to a 13px input even when both are the same height.
- `aria-label` is mandatory on any button whose label can collapse. An icon-only button
  with no accessible name announces as just "button".
- When a button becomes busy, the **spinner takes the icon's slot** so the button does
  not change width (rule A1).

### Which explainer, by pointer type

The two mechanisms are not alternatives to choose between by taste - the device decides.

| Context | Mechanism | Trigger |
|---|---|---|
| Hover-capable pointer (`hover: hover`) | Floating tooltip | Hover after ~400ms, or immediately on keyboard focus |
| Touch (`hover: none`) | **Tappable `[?]` beside the item** | Click/tap |
| Either, for anything needing more than a line | `[?]` popover | Click/tap |

**On a touch-driven project, do not build tooltips at all.** There is no hover, so a
tooltip can never be shown. Anything that needs explaining gets a small `[?]` next to it
that the user taps. Because `[?]` is click-driven it works on both, so it is the safe
choice when the project targets both.

Consequence worth stating explicitly: **never collapse a button's label on touch.** The
label is the only disclosure there. Gate the collapse on `(hover: hover) and
(pointer: fine)`, not on width alone - width alone hides the label exactly where the
tooltip cannot replace it.

### Tooltip requirements

- Shows on hover **and** on keyboard focus; hides on blur, Escape, and scroll.
- ~400ms delay on hover, none on focus.
- **Opens away from the content the element governs.** For a column header that means
  **above**: a tooltip below a header covers the filter row and the first rows of the very
  column it is describing. Flip to the other side only when there is no room.
- Clamped inside the viewport, and capped at roughly 220px wide with wrapping. A tooltip
  that spans the width of a panel stops being a hint and becomes a blindfold.
- `pointer-events: none` so it never blocks the control it describes.
- **Says more than the label.** The label is the noun, the tooltip is the consequence
  plus the keyboard shortcut. A tooltip repeating the label is wasted.
- Never the only place meaning lives - it is an enhancement over the accessible name.

### [?] requirements

- A real `<button type="button">` with `aria-expanded` and an `aria-label` of its own.
- Opens a small popover: a short title and one or two sentences.
- Closes on outside click, Escape (returning focus to the `[?]`), and scroll.
- Sits **beside** the thing it explains, never replacing a label.
- Reserve it for genuine domain terms - a `[?]` on every field is noise, and signals the
  labels themselves are not doing their job (rule K1).

Reference implementation: the button row and the *Retention margin* `[?]` in
`ui-rules-visual.html` (the reference page and the browser checks in the project this corpus came from (not carried in this package)).

---

## Appendix E: Chrome that gets forgotten (rule Y3)

Tokenising the content and leaving the browser chrome at its defaults is one of the most
common misses. The page looks themed until something scrolls, and then an OS-grey
scrollbar sits on a dark surface like a scar.

| Surface | Property | Miss it and you get |
|---|---|---|
| Scrollbar | `scrollbar-color`, `scrollbar-width`; `::-webkit-scrollbar*` as fallback | A light grey OS bar on a dark page |
| Text selection | `::selection` | Default blue on blue, unreadable on a dark or coloured surface |
| Caret | `caret-color` | Black caret invisible in a dark input |
| Focus ring | `:focus-visible { outline }` | The UA default, or worse, `outline: none` with nothing in its place |
| Placeholder | `::placeholder` | Too low contrast in dark mode, too high in light |
| Autofill | `:-webkit-autofill` | Chrome forces its own yellow or blue background over the field |
| Form controls | `accent-color` | OS-blue checkboxes and radios that ignore the brand |
| Address bar / status bar | `<meta name="theme-color">`, `color-scheme` | A light chrome frame around a dark app |

Baseline to copy:

```css
:root { color-scheme: light dark; }

* { scrollbar-color: var(--line) transparent; scrollbar-width: thin; }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: var(--line); border-radius: 6px;
  border: 2px solid var(--bg); background-clip: padding-box;
}
*::-webkit-scrollbar-thumb:hover { background: var(--muted); background-clip: padding-box; }

::selection { background: var(--accent); color: var(--on-accent); }
::placeholder { color: var(--muted); opacity: 1; }
input, textarea { caret-color: var(--accent); }
input[type="checkbox"], input[type="radio"] { accent-color: var(--accent); }
```

Notes:

- `scrollbar-color` is the standards property and is what Firefox uses; the
  `::-webkit-scrollbar` block covers Chrome and Safari. Write both.
- `color-scheme: light dark` is what makes the UA style form controls and the scrollbar
  correctly for the active theme. One line, easy to forget, fixes several defaults at once.
- Do not style the scrollbar away entirely. A hidden scrollbar removes the only signal
  that a region scrolls. Restyle it, never `display: none` it.
- `opacity: 1` on `::placeholder` is needed because Firefox applies its own opacity.

---

## Appendix F: Control sizing (rule L5)

Anything that can sit on the same line has to share a height. A search field at 26px, a
button at 34px and a chip at 20px on one row reads as broken even when every individual
control looks fine in isolation. The eye reads the ragged top edge before it reads any
of the labels.

**Two heights, from tokens:**

```css
:root { --ctl: 32px; --ctl-sm: 24px; }

.btn, .field, select, .chip, .srch { height: var(--ctl); }
```

Rules:

- **This is a recipe for a row of controls, not for every field on the page.** A textarea,
  a wrapping chip, a multi-line select or any control with a two-line label is sized by its
  content and is not in this set; scope the selector to the toolbar or action row rather
  than to `.field` globally.
- Set `height`, not vertical padding, **for the controls in that row**. Padding-derived
  heights drift the moment a control has a different font size, border width or inner icon.
- Use `display: inline-flex; align-items: center` so the label centres inside that fixed
  height instead of sitting wherever the line box puts it.
- Horizontal padding still comes from the spacing scale; only the height is fixed.
- A chip or badge is not exempt. If it sits in a toolbar, it takes `--ctl` like everything
  else, even though its content is smaller.
- On touch, the minimum is 44px: `@media (hover: none) { .btn { min-height: 44px; } }`.
- Dense contexts (a table row toolbar, a compact filter bar) use `--ctl-sm`, and then
  **everything** in that row uses `--ctl-sm`. Never mix the two on one line.

### Trap: never `display: flex` on a `<td>` or `<th>`

A table cell that becomes a flex container leaves the table layout entirely. Its column
alignment collapses, and sibling cells stack vertically instead of sitting in their
columns. To lay out several controls inside one cell, keep the cell a cell and put the
flex box inside it:

```html
<td><span class="rng"><input><input></span></td>
```

```css
.filters .rng { display: flex; gap: 3px; }   /* on the span, never on the td */
```

The same applies to `display: grid`, and to `position: relative` tricks that assume a
block box. If a filter row suddenly renders as a vertical stack, this is why.

The check: measure the bounding boxes of every child of the toolbar. Equal heights and
equal tops, or it is wrong.

---

## Appendix J: When a popover closes (rule N2)

| Kind | Closes when |
|---|---|
| Single choice (pick one of several) | **On choose.** The choice is complete, so staying open is friction. |
| Multi-select (ticks) | Outside click, Escape, or its own trigger. **Never on a tick**, because the next tick is the likely next action. |
| Editable (text, range, search inside the panel) | Same as multi-select. Closing mid-edit loses the work. |
| Mixed panel (sort, search, ticks, range together) | Same as multi-select. One single-choice action inside it, such as a sort button, may close it, because that action is complete. |

### Every way out (rule N2)

Reported from a screen recording on a phone: the user taps a column's filter button and the
panel opens up the screen. They tap the button again to close it, and again; the panel stays
open, and the search box in it flashes as if it were being re-opened. It was. The button's
handler *always opened*, and the outside-click handler *exempted the button*, so the two together
meant nothing the user could reach would close the panel. On a desktop Escape and a click
elsewhere hide the fault; on a phone there is no Escape, and the panel covers most of the
screen, so there is nothing else to tap.

| Route | Must |
|---|---|
| **Its own trigger** | Toggle: open when closed, close when open. Never "always open". |
| **Outside tap or click** | Close it. The trigger is not "outside": it toggles (above), and when it is tapped the panel closes once, not twice |
| **Escape** | Close it and return focus to the trigger |
| **A visible Done** (touch, and harmless everywhere) | Close it, return focus to the trigger; 44px on touch. Needed wherever the panel can cover its own trigger |
| **Another trigger** | Swap: the first closes as the second opens. Two panels are never open at once |

```js
trigger.addEventListener('click', function (e) {
  e.stopPropagation();
  if (openFor === trigger) { close(); return; }      // the line that was missing
  open(trigger);
});
document.addEventListener('click', function (e) {
  if (openFor && !panel.contains(e.target) && !e.target.closest('[aria-haspopup]')) { close(); }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && openFor) { var t = openFor; close(); t.focus(); }
});
```

**Do not focus the search field on open on a touch device.** It raises the on-screen keyboard,
which covers the panel it belongs to and pushes the trigger off the screen; focus it only where
`(hover: hover) and (pointer: fine)`.

**This does not apply to a read-only help bubble** with nothing in it to leave open: an outside
tap is enough there. It applies to every panel that holds controls.

**The test:** open the panel, then close it four ways, one after another: tap the trigger again,
press Escape, tap empty page, tap Done. Each must close it. `popover-check.js` does exactly this to
every dropdown on a page and reports `STUCK`, `ESCAPE`, `OUTSIDE` or, at touch widths, `NODONE`.

### The failure that looks identical to a bug

A multi-select panel that closes on every tick is usually **not** a close at all: the
component re-rendered and rebuilt the panel in its default closed state.

```
tick  ->  onChange  ->  redraw the chart  ->  the chart redraw rebuilds its controls
      ->  innerHTML replaced  ->  open panel destroyed, new one created closed
```

To the user this is indistinguishable from "it closes when I click". Two ways out:

- **The open panel must keep its identity across a redraw.** Whatever survives a rebuild
  on this stack is what the panel must be built from: a stable key or id in a declarative
  renderer, a portal that is not inside the redrawn subtree, or - in an imperative one -
  building once and updating in place, refreshing only the caption and the checked states
  rather than replacing the markup, with the live configuration held on the element
  (`el.cfg = {...}`) so handlers bound once always read current values.
- **Delegate events to the container** instead of binding to each checkbox, so a rebuild
  does not orphan the listeners.

Also: **stop propagation inside the panel.** An outside-click handler that closes the
popover will otherwise fire for clicks on the panel's own contents.

### While it is open

- Show the effect of each tick immediately: the panel stays open, the chart behind it
  updates as you go. That combination is the reason to keep it open.
- **The last tick cannot be removed** where zero would be meaningless. Disable it rather
  than allowing an empty state that renders a blank frame.
- Escape closes and returns focus to the trigger. Outside click closes.
- The trigger caption reports the state: the single name when one is chosen, a count when
  several are.

---

## Appendix K: The layout audit (rule V3)

Every layout defect I have shipped had passing behaviour checks. Counting rows, reading
values back and asserting state all succeed while the panel overflows its pane, two
columns sit on top of each other, or a value column runs under the table beside it.
**Geometry has to be measured, not assumed.**

Run this in the page after any visual change, at a **wide and a narrow width**. It takes
seconds and catches the whole class.

| Check | What it catches |
|---|---|
| `documentElement.scrollWidth > innerWidth` | The page scrolls sideways |
| `el.scrollWidth > el.clientWidth` on every panel | A pane overflowing its own box |
| `scrollWidth > clientWidth` with no `text-overflow: ellipsis` | Text clipped with no indication |
| Two panes of a split: `left.right > right.left` | Columns overlapping |
| Consecutive rows: `next.top < prev.bottom` | Rows drawn on top of each other |
| Children of a toolbar: equal tops but unequal heights | A ragged control row (rule L5) |
| `getBoundingClientRect()` is 0x0 | Something that should have rendered did not |
| Floating panels outside the viewport | A tooltip or popover clipped off screen |

### Why it keeps happening

1. **The failure is invisible to the assertions.** "12 rows, 12 bars" is true in a chart
   whose bars are stacked on top of one another.
2. **Content grows after the layout was sized.** A value column built for one number gets
   four. A label column built for "Acme" gets a 52-character company name. The grid track
   was fixed at build time and nothing re-checks it.
3. **One width is tested.** The pane the samples are viewed in is not the width the user
   has.

### The habits that prevent it

- **Give every grid track a `minmax(0, ...)`.** A bare `1fr` refuses to shrink below its
  content and pushes the neighbour out of the box.
- **`overflow: hidden` on the container, `text-overflow: ellipsis` on the text.** Decide
  what gives, rather than letting the browser decide by overflowing.
- **Cap what a cell can hold.** If a column can accumulate values, show the leading one
  and put the rest in the tooltip or the readout.
- **Re-run the audit at a narrow width**, not only the comfortable one.
- **Never `min-width: 0` on a flex child that holds a control.** It is the right default
  for a text cell that should truncate, and the wrong one for a search field: the field
  shrinks to 18px while the row still looks tidy. Give inputs a usable floor
  (`min-width: 150px`) so the toolbar wraps instead of crushing them.

### The audit has to agree with the rule it enforces

Two ways this one drifted, both found by running it at 375px with touch emulation, which
is a width the comfortable checks never reach:

- **It measured the wrong thing.** Appendix D says a tap target counts padding *and any
  pseudo-element used to enlarge the hit area*. The audit measured
  `getBoundingClientRect()` alone, so it reported 58 controls that implement the rule
  exactly as written. A check that is wrong about the rule trains people to ignore it.
- **It reported clipping that was not clipping.** Content inside an element that scrolls
  sideways is reachable, not cut off. 43 false positives at phone width, every one of
  them a table header inside a scroll box working correctly.

And the finding underneath both: **the page that legislates a rule has to pass it.** This
one was failing its own 44px rule on 180 controls, because the touch styling named a list
of selectors and the list had gone stale. A list of selectors is a promise to maintain it;
`button, input, select` is not.

### Two failures the audit found that reading the CSS did not

**`hidden` stops working the moment a class sets `display`.** The user-agent rule
`[hidden] { display: none }` loses to `.btn { display: inline-flex }` on specificity, so
`el.hidden = true` leaves the element on screen, usually showing an empty state such as
"Clear selection (0)". The fix is one line, stated once - and it costs one thing worth
knowing: an element hidden this way cannot animate out, because it leaves the layout the
instant the attribute lands. Where rule M1 wants an exit transition, hide that element
with a class the transition can run against instead:

```css
[hidden] { display: none !important; }
```

**An icon-only control passes a width check and still fails on touch.** A 16px `[?]` is
correct visually and unusable with a finger. Judge it by tap target, not by size: keep
the glyph small and enlarge the hit area with padding or a pseudo-element under
`@media (hover: none)`, to at least 44px.

---

## Appendix L: Bounded height and expand (rule L6)

**The rule bites when two or more columns share a row.** A region whose length is decided
by data rather than by design will eventually be longer than the screen: a table, a list,
a log, a feed, a comment thread, search results, an activity timeline. On its own, full
width, letting it grow and the page scroll is fine and often better. Beside something
else, it produces two failures at once.

```
   unbounded                          bounded, with expand
+--------+------------------+      +--------+------------------+
| chart  | row              |      | chart  | row              |
|        | row              |      |        | row              |
|        | row              |      |        | row          [^] |  <- scrolls
+--------+ row              |      +--------+------------------+
|        | row              |
| DEAD   | row              |        the panel keeps its shape,
| SPACE  | row              |        the neighbour keeps its size
|        | ... 54 more      |
+--------+------------------+
```

1. **The neighbour is stranded.** A 60-row table beside a 400px chart leaves an acre of
   empty space that reads as a broken layout, not as a long table.
2. **Everything below is pushed off screen.** The next section becomes unreachable without
   scrolling past hundreds of rows that were not the point.

### The pattern

- **Bound it by default.** A height that shows enough rows to be useful, roughly matching
  whatever sits beside it.
- **Scroll inside, not outside.** The region scrolls; the page does not grow.
- **Pin the header.** `position: sticky` on the header row, and on the footer if it
  carries totals. A scrolling table with the column labels gone is unreadable.
- **Offer expand, do not assume it.** One control that lifts the cap for people who want
  the whole thing. Label it for what it does next: `Expand` / `Collapse`.
- **Hide the control when it is pointless.** If everything already fits, there is nothing
  to expand, and the button is noise. Re-evaluate after every redraw, because filtering
  changes the row count.
- **Seal the sticky header.** Two things break it, both silently:
  - `border-collapse: collapse` shares each border between two cells, and a sticky cell
    then paints without its own background: rows show *through* the header as they scroll
    under it. Use `border-collapse: separate; border-spacing: 0`.
  - A **hard-coded offset** for a second sticky row. Our filter row was pinned at 32px
    under a header that is actually 30px, leaving a 2px slot for rows to scroll through.
    Measure the header and set the offset from it.
  - Every sticky cell needs its **own** opaque background. A background on the `<tr>` does
    not paint behind a sticky `<td>`.
- **Keep the toolbar outside the scroll box.** Search and filters must not scroll away
  from the rows they act on.

### Where else this applies

The same shape, not only tables: the value list inside a filter panel (capped, scrolls,
searchable rather than endless), a notifications or activity feed, a chat transcript, a
log viewer, an autocomplete list, a legend with many series, and the selection readout,
which lists a few members and then says `+ N more` instead of growing.

### When it does not apply

- **A single full-width column.** Nothing is stranded beside it, so growing and letting
  the page scroll is the simpler, better behaviour. Do not add a scroll box inside a
  scroll box.
- **A region whose length is fixed by design**, such as a five-item summary.
- **Print and export views**, where everything should be present rather than scrollable.

The test: **is something sitting next to it, and can the data make it taller than that
neighbour?** Both yes, bound it.

---

## Appendix M: What the review passes found (rules B3, X2, A3, T4, V1, V2 and Y2)

Eleven charts and eleven tables, every rule in this document applied, every behaviour
check passing. Three structured review passes found thirty-one defects between them. The
chart-specific ones are in [chart-rules.md](chart-rules.md), Appendix CE. The ones below
are general UI, and each is a promise the interface made and did not keep.

Rules V1 and V2 are here for a particular reason: both were introduced by a fix for one of
the rules above it. That is the normal shape of this work, and it is why the review pass
repeats rather than running once.

### Rule B3: a button that does nothing, and the escape hatch it became

A note before the original entry, because this rule was misused more than it was broken.
Written to stop dead buttons, it became the reason four charts had legends that only
explained: faced with an entry that could not be *hidden*, demoting it to a key looked
like following the rule. It was not. Find the action first - filter, or highlight - and
reach for the key only when there is genuinely no set of marks to act on. See
[chart-rules.md](chart-rules.md) Appendix CI, C20.



A measure picker rendered every measure as a toggle, including the one measure that
cannot be switched off (the thing being judged, C12). It had a border, a hover state and
`aria-pressed`, and clicking it did nothing at all.

- **The affordance is the promise.** Border, hover, pointer cursor and a pressed state say
  "this acts". If it does not act, it does not get them.
- **A key is styled as text**: muted, no border, no hover, and it says what it is
  (`Claimed: the measure being judged`), not just its name.
- **Disabled is a third thing**, and it is not the answer here. Disabled means *not right
  now*, so it has to say why and be able to become enabled. Permanently disabled is a key
  wearing a button's clothes.
- Same defect class as a `[hidden]` attribute beaten by a `display` rule: what is on
  screen and what is true have come apart.

### Rule B4: the halo that says "this acts"

A pointer moving over a screen is asking one question of everything it crosses: *does this
do something?* A clickable thing answers by showing a ring around itself. It is learned in
one pass and never taught, which is why it is worth being the same everywhere.

| State | What shows |
|---|---|
| At rest | The item's own surface and border. **No halo** - a halo at rest is the glow L4 rejects, standing in for depth |
| Pointer over it (`hover: hover` only) | The halo |
| Keyboard focus (`:focus-visible`) | The same halo - one ring serves both, so a keyboard user learns the same cue |
| Pressed | The halo, with the item's pressed state; on touch this is the only cue there is |
| Cannot act (B3) | Nothing. No halo, no pointer cursor, no pressed state |
| Disabled (not right now) | Nothing, and it says why |

```
:root { --halo: 0 0 0 2px var(--accent), 0 0 0 5px var(--accent-soft); }
.clickable:focus-visible,
.clickable.is-hover       { box-shadow: var(--halo); }
@media (hover: hover) {
  .clickable:hover        { box-shadow: var(--halo); }
}
```

The 2px edge in the accent is what makes it a cue; the soft tint outside it is what makes it a
halo. The tint alone measured 1.14:1 against the page in both themes - invisible to anyone who
does not already know it is there - and it was also meant to be the focus ring.

The halo is a `box-shadow` with no offset or blur, or an `outline`, never a change to
`border-width`, `padding`, `margin` or `transform: scale`. Those move the item: the edge the
pointer was on slides away from under it, the hover ends, the item snaps back, and the
result is a flicker at the border of every button. The hover rule sits inside
`(hover: hover)` so a tap on a phone does not leave a halo stuck on the last thing touched.

**On an SVG shape, neither `outline` nor `box-shadow` follows the shape.** Both are drawn
from the bounding box, so a ring round a wedge or a circle is a rectangle. Use a `stroke`, or
a `drop-shadow` filter, which traces the shape's own outline - see `chart-rules.md`
Appendix CC.

**This is not the glow L4 rejects.** L4 is about depth: a shadow that lifts something has an
offset, because it stands for light. A halo that appears when the item is hovered is not
claiming the item is lifted. It is reporting a state - "the pointer is here, and this
responds" - and a state cue has no light source to be consistent with.

Four ways it goes wrong:

- **Nothing answers.** Clickable and silent: the user cannot tell a button from a label
  without clicking it.
- **Each component answers differently.** One darkens, one underlines, one grows. The cue no
  longer means "clickable"; it means "this component's style".
- **The cue moves the item.** A border that thickens, a scale-up: see above.
- **Something that cannot act answers anyway.** A legend key or a badge with a halo promises
  an action it does not have, which is B3's defect arriving from the other direction.

**The test:** hover each kind of clickable thing on the screen - a button, a row, a chip, an
icon. The same ring appears on each, and the item's box does not change by a pixel. Hover
something that does not act: nothing. Then press Tab: the same ring, on the same things.

### Rule X2: the label that lies to one audience

Every bullet row announced `... of contract 2600` because 2600 was the scale maximum, the
number the geometry needed. Four of the five rows had a different contract. Sighted users
saw the correct figure on screen; screen-reader users were told the wrong one, with no way
to notice.

- **Build the accessible name from the record, not from the render.** If the label is
  reading a variable that the layout needed, it is probably wrong.
- **Check it the only way that works: read the labels out.** `$$('[aria-label]').map(e =>
  e.ariaLabel)` next to the visible values. Five seconds, and it is the only check that
  catches this.
- Applies past charts: a row action labelled "Delete" that deletes the *selected* rows, a
  progress bar whose `aria-valuemax` is the group maximum, a "3 of 12" built from the
  unfiltered count.

### Rule A3: the clear that did not clear

`Clear filters` reset the search and the column filters. It left the legend toggles, the
measure picks and every selected mark exactly as they were, while its tooltip said it
cleared the filters and the user's mental model said it cleared *everything*.

- **Decide what the button owns, then own all of it.** The user does not distinguish "a
  column filter" from "a series I hid": both are ways they narrowed what they are looking
  at.
- **Snapshot the defaults at load and restore from the snapshot**, rather than
  re-typing the initial values in the reset path where they will drift.
  [Engineering rule 32b](../../kz-engrules/rules/engineering-rules.md) covers the aliasing trap that lurks here:
  a snapshot of an array or object must be a copy, or the live state mutates the default.
- **Derive the label from what it will clear**, from the same code that does the clearing.
  A hand-written tooltip drifts the moment the behaviour changes, and then it is rule X2
  again with a different audience.
- Reversible and instantly visible, so it needs no confirmation. Rule S2 is for the
  destructive ones.

### Rule T4: two mechanisms for one job

The candlestick table had a full filter panel on every column (rule T1, rule T2) *and* a
single-select `Direction` dropdown in its toolbar. Two ways to narrow the same table,
side by side, behaving differently: one multi-select with counts and a live apply, one
single-select that silently replaced the previous choice.

- **The fix is to delete the bespoke one**, and where it filtered something the general
  mechanism could not reach, make that reachable: direction became a real column, so it
  sorts, filters and explains itself like everything else.
- **A toolbar control that duplicates a column filter is a sign the column is missing.**
  Ask what the dropdown knows that the table does not show.
- The cost is not just inconsistency. Two mechanisms means two code paths, two reset
  paths, and the second one is the one that gets forgotten: this dropdown was not reset
  by "Clear filters" either.

### Rule V1: the label was right and the behaviour was not

Worth recording separately because it is a mistake made *while fixing* rule A3, in the
same file, the same hour.

The Clear button's tooltip was derived from the section's own DOM: if the section has a
legend with buttons, say it clears the legend. The clearing itself came from a
hand-maintained list of which chart holds which state. Three charts had a legend and were
not in the list, so the button correctly *promised* to clear the legend and then did not.

- **A claim and the behaviour it describes come from one source.** Deriving the sentence
  is not enough if the action is still hand-written: two sources of truth drift, and the
  derived one is the more convincing of the two.
- The same shape produced the sort arrow: `aria-sort` was painted in the click handler
  and in `setSort`, so a reset that changed the sort by a third path left the arrow, and
  the announced state, on a column the table was no longer sorted by. Painting it in the
  draw from `state.sort` leaves nowhere for the two to disagree.
- **The test:** if the state can be changed by more than one path, is the rendering done
  by all of them, or once where they all end up?

A third, found by a reviewer, about ORDER rather than place: **a table renders its cells
before its chart draws.** A value cached by the chart for the table's columns to read is
therefore one draw behind, so the funnel's cells said "64.9% of the previous stage" while
the bar beside them was drawn against a different stage and said 41.4%. Derive it on
demand from the rows the table is showing and there is no cache to be stale.

Two more instances, both found by a sweep that looked for this pattern rather than for
defects, and both worth naming because they do not look like state at all:

- **A media query is state.** `matchMedia(...).matches` read once at load freezes the
  script's idea of the device while the CSS on the identical query keeps re-evaluating.
  Attach a mouse to a tablet and the two disagree: the stylesheet moves to the hover
  layout and hides the `[?]` that carried every column's explanation, while the script
  still believes there is no hover and never shows a tooltip. The explanation is then
  unreachable by either route. Subscribe to `change`; do not sample once.
- **A popover outlives the control it is anchored to.** Anything that re-renders a region
  can destroy the element a floating panel is positioned against and owned by. The panel
  is left describing something that is no longer on the page, with no expanded owner for a
  screen reader to find, and its own toggle stops closing it because the identity it
  compares against has been replaced. Close it where the redraw happens.

### Why this section is not a longer list of rules

Sixty-odd rules exist in these documents, and a sweep looking specifically for this one
pattern still found fourteen fresh breaches of rules already written down - two of them in
code written an hour earlier, immediately after writing the rule against it.

So the response to a recurrence is **a check, not another rule number**. Every class in
this appendix now has an assertion in `state-check.js` (the reference page and the browser checks in the project this corpus came from (not carried in this package)) that fails when the
class comes back, and each of those assertions has been watched failing (engineering rule
29a). A rule tells you what to do once. A check tells you when you have stopped doing it.

### Rule Y2: the two ways out of a contrast problem

Chart labels on the reference page were muted grey, sat on top of the petals they named,
and were clipped to nine characters. Three problems, and the contrast one has exactly two
solutions - both were needed here, for different text:

| | Used for | How |
|---|---|---|
| **Raise the contrast** | Text that names something: a category, a series, an axis | It is content, so it takes the body text colour. Muted is for scale values and chrome |
| **Outline, shadow or backing** | Text that can land on a mark whose colour you do not control | `paint-order: stroke` with a stroke in the surface colour gives a halo that costs no layout |

**A halo separates; it does not outline.** 3px read as a deliberate stroke around every
letter, which is a second typographic weight nobody chose. 1.5px is enough to stop a glyph
dissolving into the fill behind it and is invisible as an effect. And a label inside a
chart is a caption, not body text: 10px against the page's 11px chart face, so the marks
stay the loudest thing in the frame.

There is a second-order effect worth knowing, because it decides the size of the chart.
On a radial chart the outer radius is capped by **the longest name raying off the top**,
not by the circle. Reducing the label from 11px to 10px shortened the longest ray by
enough to grow the ring from 76 to 84 units and the hole from 46 to 50. Smaller text made
a bigger chart, which is not obvious until the constraint is written down.

A label inside a shape has a second trap, separate from contrast: **the text is drawn
horizontally, so the room it needs is not the room the shape appears to offer.** A phase
name in a sunburst ring passed an arc-length test and then ran straight across its
neighbours, because at three o'clock the constraint is the ring's 24px thickness and not
the arc. Either measure the direction the text actually occupies, or put the label
outside - which is what both radial charts here now do.

Neither is a substitute for the third fix, which is **not putting the text there in the
first place**: the category labels moved out to a single radius outside the rings, so
they form a ring of names instead of drifting in and out with the petal they belong to.
Only the scale values, which have nowhere else to go, rely on the halo - and they are
placed in the quadrant with the least ink, derived from the data rather than guessed.

### Rule X2, part two: where the name goes, and what may write it

Found by the gate, after two review passes had signed off on rule X2 as fixed. Five
bullet marks were focusable `role="button"` controls with `aria-label=""`, in a page whose
own appendix promised every mark had a name.

Two separate mistakes, both worth stating:

- **The name goes on the element that takes focus.** The description existed, and it was
  correct, and it was on an inner `<span role="img">` that nothing can focus. The
  outer `div` was the control. A description a keyboard cannot reach is not a name.
- **A helper that decorates a value must not create one.** The code read
  `(el.getAttribute('aria-label') || '') + suffix`, which is a reasonable-looking line
  that writes an empty `aria-label` onto every element that did not have one. Augmenting
  is not the same as setting: if there is nothing to extend, do nothing.
- And the third, which is rule V1 again: that helper ran at load and after a legend
  build, while the state it described - selection - changes at neither moment. It was
  correct once and stale afterwards. It now runs where the selection is painted.

The probe is the one Appendix M already prescribed, and it has to be run against the
elements that are actually focusable:

```js
$$('[data-id][tabindex], [data-id][role="button"]')
  .filter(el => !(el.getAttribute('aria-label') || '').trim())
```

Expected: empty. It returned five.

### Rule V2: the empty path is a path

The fix for C15 moved eleven legends above their empty guards. Directly below each guard
sat the code that prunes the selection and repaints the readout, and it stayed there.

Ten charts out of eleven would then filter down to nothing, draw "No rows match the
current filters", and keep a floating readout reporting two selected marks, their combined
total, and a `Clear selection (2)` button, for rows that were no longer on the page.

- **Anything the render owns happens on every path through it**, including the one that
  returns early. If it matters when there is data, it matters more when there is none.
- **Shared state is maintained where everything passes through**, not in each consumer.
  The selection belongs to the chart *and* the table *and* the readout, so pruning it
  inside each chart was eleven copies of one rule with ten of them below a return.
- **Centralising it is half the job; the other half is the right test.** The first
  attempt moved the pruning into the table's draw and pruned against *the rows the table
  is showing*. That is the weaker criterion: a legend can withhold a mark for a row that
  is still in the table, so the defect survived in the one case it was written for. The
  invariant is "selected implies drawn", and it belongs in the function that builds the
  readout.
- **Count the returns in a draw and check each one.** Every early return is a path that
  the happy path's checks do not cover.
- The tell: a fix that has to be applied in eleven places is usually in the wrong place.

### Why these survived every check

They were all *correct code doing the wrong thing*. Nothing threw, nothing rendered
blank, every automated check passed, including checks written specifically for the
previous round of the same defect. The two probes that found them:

1. **Use the control, then read everything else on the screen.** Not "does it work", but
   "what else should have changed and did not".
2. **Ask what the element promises.** A border promises an action, a label promises a
   number, a Clear promises a clean slate, a dropdown promises it is the way to filter.
   Then check each promise against the behaviour, one at a time.
3. **A layout slot is a claim about what is in it.** A row with a label on the left and
   a figure hard right says "this is that label's value". Put a sentence there and the
   sentence is read as the value, in the weight reserved for a total: `Counts do not add
   up | each stage is inside the one before` rendered as though the caveat were the
   number. The fix is not shorter prose, it is **a row type for prose** - full width,
   wrapping, never bold, because bold in that panel already means "total". If a panel
   carries three kinds of content it needs three kinds of row, and a kind that has to
   borrow another kind's shape is missing.
4. **And read what the documents promise.** The rules are part of the deliverable. Three
   passes fixed the page and left the documents citing a rule that was never written,
   defining one number twice, giving two appendices the same heading, and describing
   eleven principles where there were twelve. Every one of those is believed by the next
   person to read them, which is worse than a gap.

And then write the second probe down as a check, because it is the one that keeps
finding things: `state-check.js` (the reference page and the browser checks in the project this corpus came from (not carried in this package)) now drives every table through 0, 1 and
all rows *and* through a click on every sortable column, asserting after each that the
chart still matches the table, that the header announces the sort it applied, that no
legend entry offers to show something already shown, and that Clear puts every chart's
own state back where it started.

---

## Appendix N: An overlay that claims the screen (rule N1)

The most reliably shipped bug in LLM-written UI, and the reason is that three quarters of
it is free. A `<dialog>` opened with `showModal()` makes everything outside it inert, so
focus cannot land behind it and a click cannot reach through it, and Escape closes it with
focus restored. Measured on this page, all three were already true.

The fourth is not free, and nothing warns you:

> Open the modal, put the pointer anywhere outside it, turn the wheel. The page behind
> slides around underneath a box that is supposed to have stopped the world.

### The four, and who provides them

| | Provided by `showModal()` | Verified how |
|---|---|---|
| Nothing behind takes focus | Yes | `behind.focus()`, then `document.activeElement !== behind` |
| Nothing behind takes a click | Yes | `elementFromPoint` over a background element returns the dialog or its backdrop |
| Escape closes, focus returns | Yes | guaranteed by `dlg.matches(':modal')` |
| **Background does not scroll** | **No** | see below, and it is not what you would expect |

### Locking the scroll, and paying for the scrollbar

`overflow: hidden` on the root, or `position: fixed` on the body. Either works. And
whichever you pick, **give back the scrollbar's width as padding**: removing the scrollbar
reclaims its space, so the whole page jumps sideways as the modal opens. That sideways
jump is the tell that somebody locked the scroll and stopped there.

```js
var barWidth = window.innerWidth - document.documentElement.clientWidth;
document.documentElement.style.overflow = 'hidden';
if (barWidth > 0) { document.documentElement.style.paddingRight = barWidth + 'px'; }
```

### Release it on every path, and guard it against the next open

`close` fires **asynchronously**. Two consequences, both found by probing rather than by
reading:

- Release on the user's action as well as on the event, or there is a frame where the
  dialog is gone and the page still cannot scroll.
- Guard the release on `!dlg.open`. Open the modal again quickly and a previous call's
  close event lands while the new one is up, unlocking the page behind a modal that is
  still on screen. It takes three opens in a row to see it, which is not an exotic thing
  for a user to do.
- **The close event is not every path.** Found on the reference page: a browser that does
  not fire `close` for a *programmatic* `dialog.close()` leaks the lock every time
  something other than the user closes the dialog - a route change, a timeout, a parent
  component tearing down, a test. A release hung on that event passes every manual trial,
  because a person always closes it the one way that works. Watch the element's own open
  state (an observer on the `open` attribute, or whatever the stack calls that) so the
  release follows the *state*, not the notification - which is rule V1 applied to a lock
  rather than to a rendering.

### Why the check asserts the mechanism, and not the behaviour

Worth stating plainly, because it looks like the weaker check and is the honest one.
Measured here:

- `overflow: hidden` on the root does **not** stop `window.scrollBy` - it moved 200px -
  nor `scrollTop`, which moved 150. Programmatic scrolling ignores the lock by design.
- A synthetic `wheel` event scrolls **nothing**, locked or not, because untrusted events
  never scroll.

So a script can neither perform the user's gesture nor be blocked by the lock, and any
assertion shaped as "try to scroll and see" always lands the same way up whatever the
page does. `state-check.js` (the reference page and the browser checks in the project this corpus came from (not carried in this package)) therefore asserts that one of the two
mechanisms that stop a real wheel is in force, and names both so either passes.

**The behaviour still has to be verified once, with a real gesture.** It was, with a
trusted wheel over the page behind an open modal: `scrollY` stayed at 400. That is the
only test that proves the thing users care about, and it is not one a script can run.

### The probe that moved what it measured

One more, because it nearly hid all of the above. The first version of the check created
its opener button, appended it to the end of `<body>`, and focused it. Focusing scrolled
it into view - to the bottom of a 34,000px page - so the assertion that followed tried to
scroll down from the very bottom, could not move, and passed. Against a page with no lock
at all.

`focus({ preventScroll: true })`, and park the probe's own furniture where it cannot
disturb the thing being measured.

---

## Appendix O: The mobile shell (rules L8, N3)

The defect this appendix exists for always looks the same: **the last row of the list sits
underneath the bottom bar and cannot be reached**. It happens because the content was
given the whole viewport and the bars were laid on top of it afterwards.

### The frame

```
+---------------------------------------+
| [home]  [search.................]  [=]|  sticky top: sibling, not overlay
+---------------------------------------+
|                                       |
|  the ONLY scroller                    |  min-height:0 and overflow:auto
|                                       |
+---------------------------------------+
| [Filter]   [Sort]      [ New job ]    |  contextual toolbar, when there is one
+---------------------------------------+
| [Today][Jobs][ + ][Sites][More]       |  bottom navigation, 4 or 5 slots
+---------------------------------------+
```

A column flex container, three `flex:none` bars and one `flex:1; min-height:0` middle.
Built that way **the overlap cannot happen**, because the bars take their own space and
the scroller is what is left. That is the fix: not padding, but a layout in which there is
nothing to pad around.

### When a bar must overlay, measure it

Sometimes it must - a floating action bar, a bar that hides on scroll. Then:

```js
var h = 0;
[toolbar, bottomNav].forEach(function (el) {
  var pos = getComputedStyle(el).position;
  if (pos === 'fixed' || pos === 'absolute') { h += el.getBoundingClientRect().height; }
});
content.style.setProperty('--m-bars', h + 'px');
```

Measured, not typed. A number in the stylesheet is right until somebody adds a second line
to a label, and then the last row of every list in the app is unreachable forever, on a
device the author does not own. Re-measure on resize and whenever the bar's contents
change.

### Four things about the mobile viewport that are not true on a desktop

| | |
|---|---|
| **`100vh` is wrong** | `vh` is the viewport at its *tallest*, so the bottom of a `100vh` layout sits under the browser's own chrome until the user scrolls it away - exactly where a bottom bar lives. Use `100dvh` |
| **The safe areas are not padding you invent** | `env(safe-area-inset-bottom)` for the home indicator, `env(safe-area-inset-top)` for the notch. A hardcoded 34px is one device |
| **The keyboard resizes the viewport** | It covers a fixed bottom bar. Either `interactive-widget=resizes-content` in the viewport meta, or drive the layout from `visualViewport` |
| **Overscroll reveals what is behind** | `overscroll-behavior: contain` on the scroller, or the rubber band shows the page underneath |

### Rule N3: whose bar is it

Five slots, because a thumb can hit five and not seven, and the fifth is usually the way
to everything that did not fit. Which pages go in them is **not a decision the designer
gets to make once for everybody** - the pages people actually use differ enough that any
fixed choice is wrong for most of them.

So the arrangement is a preference, and it is edited the way people already know how to
arrange things on a phone: **drag a page into a slot, or between slots**. Dropping onto a
full slot swaps, because that is what everybody expects; it does not push the occupant
into a menu it will never be found in again.

And the part that is usually missing: **a keyboard route to the same thing**. Drag and
drop with no keyboard equivalent is a preference half the users cannot set. The pattern
costs very little:

> Space picks the page up. Arrow keys move it between slots, or down into More and up out
> of it. Space drops it, Escape puts it back.

with the held item announced, `aria-grabbed` set, and the hint line saying which keys do
what while something is held.

### Two ways around, doing different jobs

Easy to get backwards, and I did:

| | Holds | Job |
|---|---|---|
| **Bottom bar** | 4 or 5 | The places you go constantly, one tap away |
| **Hamburger** | **Everything** | Every destination there is, including what did not fit |

The menu is not a shortcut to settings, and it is not "the leftovers". It is the complete
list, and **that is what makes a five slot bar safe**: leaving a page out of the bar costs
it one tap, it does not make it unreachable. Build the menu as the leftovers and every
slot decision becomes a decision about what the user can still get to, which is why people
then refuse to take anything out.

Two consequences in the code:

- **A bottom tab navigates.** Mine highlighted the tab and changed nothing else for a
  while, which looks right in a screenshot and is not an app.
- **A page reached from the menu marks no tab**, because it is not in the bar. That is
  honest: marking the nearest tab would claim you are somewhere you are not.

### A sheet is bounded by the screen it rises from

The menu lists every destination, so it is as long as the app is. Unbounded, it grew
straight off the top of the phone and took its own Close button with it.

`max-height` against the frame, `overflow-y:auto`, and `overscroll-behavior:contain` so
scrolling the end of the sheet does not start scrolling whatever is behind it. The same
bounding rule as rule L6, applied to the one surface where running out of room is normal
rather than exceptional.

### Arrange the real thing, in place

The editor is a drawer above and the bar below, and **the bar below is the real one**.
There is no preview of the arrangement, because the arrangement is right there: opening
the edit screen puts a dashed outline on every slot, which is the whole signal that it
can be rearranged now, and drops land on it directly.

```
[ + Shortcut ] [ Reset ] [ Clear all ]     toolbar at the top: the bottom is spoken for
   [1]  [2]  [3]  [4]                      the drawer: every page, four across
   [5]  [6]  [7]  [8]                      including the ones already in the bar
- - - - - - - - - - - - - - - - - -
  [1'] [4'] [5'] [2'] [8']                 the real bar, dashed while arranging
```

Four details that are easy to get wrong:

- **Pages already in the bar stay in the drawer**, marked, rather than disappearing from
  it. A drawer that hides what is placed makes the user hunt for what is missing.
- **An emptied slot stays as a dashed box** rather than the row closing up. The slot you
  just emptied is the one you are about to drop into, and a bar that reflows under the
  finger cannot be aimed at.
- **While arranging, the bar does not navigate.** A tab that went somewhere mid-arrange
  would throw the screen away under the user's own finger.
- **Dropping onto a full slot swaps.** The occupant takes the place the dragged one came
  from, and only leaves the bar if the dragged one came from outside it.

### Clear and reset are wipes

Standing rule S2 lists **clear** and **reset** alongside delete, and this screen is why.
Neither destroys data, and both destroy an arrangement somebody made by hand, which they
will not enjoy rebuilding. So both name what is going:

> **Empty the bar?** All five slots are cleared, including Today, Jobs, New job, Sites,
> Settings. Every page is still reachable from the menu, and you can drag them back.

Two things that distinguish them from a delete, and should:

- **Neither is styled as danger.** Red is kept for the one action that destroys something
  - deleting a shortcut - or it stops carrying meaning. Clear all is red; Reset is not.
- **Both offer undo in the toast**, because both are perfectly reversible and the previous
  arrangement is a single array to put back.

### The editor is a screen, not a panel

The first version of the bar editor was a four column table with a filter dropdown per
column and three text buttons on every row. It worked, and it was a desktop screen in a
phone case. Every part of it assumed a pointer: a filter dropdown assumes something that
can hover a narrow target, and three inline buttons assume a row wide enough to hold them
at 44px each, which 288 pixels is not.

The same CRUD, in the shapes a phone already has:

| The same job | On a wide screen | On a phone |
|---|---|---|
| Read the list | Sortable columns, filter per column | One row per item, one line, in slot order |
| Reorder | Drag, or type a position | Drag the tile, the way apps are arranged |
| Add or remove | A button among others on the row | One control on the row: In bar, or Add |
| Rename | Inline edit in the cell | Overflow, then a sheet |
| Delete | Row button, then a modal | Overflow, then a sheet that names it |
| Create | A form above the table | A sticky button, then a sheet |
| Where it lives | A panel beside the thing it edits | **A screen**, because the viewport is all there is |

Two things generalise past this editor:

- **A row on a phone is one tap target with one control.** Everything else goes behind an
  overflow, because a row cannot hold three 44px targets and the name of the thing.
- **The phone's overlay rises from the bottom edge**, where the thumb is, not from the
  centre where a mouse is. A sheet, not a dialog box - and it still owes the four things
  in rule N1, scoped to the frame it is in.

The mistake worth naming is not "used a table". It is treating the surface as a container
that the same interface gets poured into. **The surface is part of the design.**

### What the audit caught here

The drag handles on the customise screen were 38px tall on touch - the one control on the
page most certain to be used with a thumb. The blanket `button { min-height: 44px }` in
the touch media query had lost to `.navitem`, because a class beats a bare element
selector whatever the order they are written in.

Worth keeping as a habit rather than as a one-off fix: **anything that sets its own height
has to be named in the touch rule too**, and the way to know is to run the audit at 375px
with touch emulation rather than to reason about specificity.


---

## Appendix P: A required field (rule F1)

Three separate jobs. The usual form does the third one only, and that is the complaint.

| | When | What it does |
|---|---|---|
| **The mark** | Before anything is typed | Says this field is required, so nobody discovers it at the end |
| **The nudge** | On the way out of an empty required field | Says it there, beside the field, while the form is still on the screen it was on |
| **The block** | On submit | Refuses, counts what is missing, and puts the cursor in the first one |

### The mark

An asterisk on the label, in the warning colour, present while the form is still empty.
**Mark the optional ones too.** Marking only the required half leaves the reader guessing
whether the unmarked fields are optional or whether the form simply forgot to mark them.
One `optional` in muted text next to the label settles it.

### The nudge

This is the one that is normally missing, and it is the one that costs. A form that only
complains at submit makes someone scroll back through everything they just filled to find
the box that was wrong; on a phone the summary at the top is not even on screen when the
button is pressed.

- Fires on **blur** of an empty required field - leaving it is the moment to say so.
- The message names the field (`Site is needed before this can be saved`), because a bare
  `Required` under a box is the same information the asterisk already gave.
- It sits **next to that field**, not in a summary elsewhere.
- It clears on **input**, the moment the field is no longer empty, without waiting for
  another exit. A message that persists after the problem is fixed teaches people to
  ignore messages.
- `aria-invalid="true"` and `aria-describedby` pointing at the message, so the field is
  announced as invalid with its reason rather than looking red to sighted users only.
- **The field itself is marked, and the mark is a figure.** The border takes the error colour,
  and that border is **at least 3:1 against the surface it sits on, in both themes** - a pale
  tint is decoration (a border at 1.3:1 was caught by the assertion for this). The message is
  the second signal, so the state is never colour alone (C7).
- **Marking a field never changes its size.** Change the border's colour, and add a shadow ring
  if more weight is wanted; never its width, which moves the field by a pixel as the user's
  pointer is on it. The assertion measures the field before and after.

### The block

- `novalidate` on the form, so the check is the one that has been designed rather than the
  browser's own bubble, which disappears on the next click and is not styleable.
- **Count**: "2 fields still need filling", not "please fill in the required fields". The
  count tells someone whether they are one away or six.
- **Focus the first one.** A message with the cursor left where it was is a message that
  has to be acted on by hunting.
- Nudge every missing field at once, not just the first: the person can see the whole
  remaining job.

### Entering a digit-only field (rule F5)

The default behaviour of a text field assumes the user is amending what is there. For a
field that accepts only digits, that assumption is usually wrong: someone editing `1200`
almost always means to type `850`, not to insert a digit into `1200`.

**The trigger is the field's own restriction**, which is why this rule needs no judgement
about what a user meant: if the field refuses letters, it selects on entry. A field that
accepts text - a note, a reference, a name - is outside the rule, whatever it usually
holds.

- **Select on focus, from every route.** Tap, Tab, and a programmatic focus after a failed
  submit all count. A field that selects on Tab but not on tap is worse than one that never
  does, because the behaviour is now unpredictable.
- **A second tap places a caret.** Once the value is selected, a tap inside it means "I do
  want to edit this one" - honour that rather than re-selecting. Arrow keys and a drag do
  the same. Select-all is an offer, not a lock.
- **The stepper still steps.** Where the field has increment controls, they adjust the
  value and do not clear it; select-all applies to typing, not to the buttons.
- **Where it does not apply**: any field that accepts more than digits. A note, an
  address, a reference being appended to, a name being corrected - there the typical edit
  adjusts what is there, and selecting it all means one keystroke destroys it. The test is
  mechanical: can a letter be typed into this field? Then leave the caret alone.

**The test:** focus the field by tap and by Tab, then type one digit. The field holds that
one digit, both times. Then tap once more inside a selected value and type: it inserts,
because the second tap said so.

### Enter moves on (rule F9)

Reported as "when I press Enter it doesn't go to the next input": an agent builds several fields in
a form and leaves the browser's own behaviour, which is that Enter in any field **submits the whole
form**. Nobody chose that. It is what an unhandled form does, and on a form with required fields
(F1) it means every Enter in the first field produces an error message about the fields that have
not been reached yet.

| Where Enter is pressed | What it does |
|---|---|
| A single-line field that is not the last | Moves to the next field, as Tab does; selects its value if it is digit-only (F5) |
| The last single-line field | Submits - or, in a form that cannot be undone, moves to the confirming button |
| A textarea | Inserts a line (F4). Ctrl or Cmd with Enter may submit |
| A select, or a field with a suggestion list open | Chooses; it is the control's own key |
| A button | Activates it |
| During an IME composition | Nothing: it belongs to the composition (`event.isComposing`) |

Skip fields that are disabled, read-only or hidden when finding "the next one".

```js
form.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' || e.isComposing || e.defaultPrevented) { return; }
  var el = e.target;
  if (!el.matches('input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio])')) { return; }
  if (el.getAttribute('aria-expanded') === 'true') { return; }                 // an open list owns Enter
  var fields = Array.prototype.filter.call(
    form.querySelectorAll('input:not([type=hidden]), select, textarea'),
    function (f) { return !f.disabled && !f.readOnly && f.offsetParent; });
  var next = fields[fields.indexOf(el) + 1];
  if (next) { e.preventDefault(); next.focus(); if (next.select) { next.select(); } return; }
  if (form.hasAttribute('data-confirm')) {                                     // cannot be undone
    e.preventDefault();
    form.querySelector('[type=submit]').focus();                               // land on the button; Enter there confirms
  }
});
```

**What counts as a form that cannot be undone:** it deletes, it takes money, it sends something to
another person, it spends something that cannot be earned back (a one-time code, a quota), or it
changes who can sign in. The test is the one S2 uses: could the user get back to where they were?
If not, the last Enter is a question - "this will do X, go ahead?" - not an answer.

**On a phone** the keyboard's Enter key can say what it will do: `enterkeyhint="next"` on every
field but the last, `"done"` or `"go"` on the last. Without it the key reads "return" on every
field and offers no hint that it moves anywhere.

**The test:** in a form of three fields, type in the first and press Enter: focus is in the second
and nothing was submitted. Enter in the last: it submits, or in a form that cannot be undone, focus
is on the confirming button and nothing was submitted. `typing-check.js` presses Enter in every
field but the last and reports an `ENTER` where focus did not move to the next one.

### Typing that keeps breaking (rule F8)

Reported from a phone as "when I type in an input the screen either keeps moving or keeps
re-rendering, and my typing keeps breaking". It is four different defects that feel like
one, and the reference page for these rules had two of them in every chart it holds:
typing a filter removed rows, the chart above the table got shorter, and the field jumped
up to 500px under the finger - on a phone only, because on a desktop the chart sits beside
the table. And every field on the page was 13px, so each one zoomed the page on focus.

| What the user sees | What happened | The fix |
|---|---|---|
| The keyboard closes after one letter; the next letter goes nowhere | The field was **rebuilt**: an update re-rendered the region holding it, and the element with focus was replaced | Update what changed - the list, the count - and leave the field's element alone. In a component framework, the field keeps a stable identity across renders; a component defined inside another's render is a new component every time |
| Letters land in the wrong order; the caret jumps to the end | The value was **written back** on the keystroke, late or reformatted | Write the value only when it differs from what is there; after formatting, restore the caret by counting the user's own characters, not by position |
| The field slides up or down while typing | Something **above** it changed height, or the page was scrolled on input | Put what reacts to typing below or beside the field, or reserve its space; where the layout cannot change, measure the field before the update and scroll back by the distance it moved. Native scroll anchoring does this where it exists, but it anchors on whatever is first on screen - often the very thing that is changing - and not every engine has it |
| The page zooms in on tap and stays zoomed | The field's text is under 16px (Appendix Q) | 16px for every field at phone width, as a floor no component can go under |

**The keyboard is a resize.** On most phones, opening the keyboard resizes the viewport
(Appendix O). A resize handler that redraws the page therefore redraws the field the user
just tapped, and the keyboard closes as it opens. Resize handlers adjust what depends on
size; they never rebuild a region holding a focused field.

**The test:** `typing-check.js`, pasted into the console at phone width. It types into the
*middle* of every text field - typing at the end hides a caret that jumps to the end - and
reports REBUILT, CARET, MOVED and ZOOM. Then do it by hand once on a real phone: tap a
filter, type a word that removes most of the rows, and watch whether the field stays under
your thumb.

### What each field accepts (rule F7)

A pattern has two jobs, and they are done at different moments. **As the user types**, it
refuses characters that could never belong - which is also what makes F5's "digit-only"
a mechanical fact rather than a guess. **When the user has finished** (F2), it checks the
whole value's shape. Neither job is "reject anything unusual": the costliest pattern
defect is the one that turns away a real customer's real name.

| Field | Refused as typed | Whole value, after normalising | Normalise first | Checked separately |
|---|---|---|---|---|
| Quantity, count | all but digits (and F6's arithmetic, decimal point included) | `^\d+$` on the result | - | min and max |
| Price, amount | all but digits, `.` (and F6's) | `^\d+(\.\d{1,2})?$` - decimals = the currency's minor units | thousands separators | min and max |
| Percentage | all but digits, `.` (and F6's) | `^\d+(\.\d+)?$` | a trailing `%` | 0 to 100 |
| Email | spaces | `^[^\s@]+@[^\s@]+\.[^\s@]+$` - loose on purpose | trim | a confirmation email is the only real check |
| Phone | letters | `^\+?\d{7,15}$` (15 is the international maximum) | spaces, dashes, brackets, dots | - |
| Postcode | per country | per country, e.g. `^\d{5}$` for a five-digit system | trim, upper-case | that it exists, where it matters |
| Card number | all but digits and spaces | `^\d{12,19}$` | spaces | the Luhn checksum |
| One-time code | all but digits | `^\d{6}$` - or whatever length the sender sends | spaces from a paste | - |
| Name | nothing | `^\S.*$` - not empty, and that is all | trim, collapse double spaces | - |
| Password | nothing | `^.{N,}$` - length only | **nothing: never trim a password** | - |
| Date | - | use the platform's date control; a pattern cannot know February | - | a real date, in range |

Four things that go wrong, in the order they are found:

- **Unanchored.** `\d{5}` is satisfied by five digits *somewhere* in the value. Every
  whole-value pattern starts with `^` and ends with `$`.
- **Two copies.** The field has one pattern and the server another, and they drift. Write
  it once and use it in both, or have the server send it.
- **Too strict.** A name pattern of letters and spaces rejects apostrophes, hyphens,
  accents, non-Latin scripts and one-letter names. An email pattern copied from a forum
  rejects `+` addresses and new top-level domains. When a pattern must choose, it accepts.
- **Rejecting format instead of removing it.** `012-345 6789` is a phone number with some
  punctuation in it. Strip the punctuation and check what remains; do not tell the user
  their phone number is invalid.

**The test:** for each field, one real value from its row passes and one near miss fails -
a sixth postcode digit, a letter before the digits. Then try the three real values patterns
most often reject: `O'Brien`, `ana+quotes@shop.my`, and a phone number typed with spaces.

### Arithmetic in an amount field (rule F6)

The field is not asking for a number; it is asking for the answer to whatever the user was
about to work out. `12 cartons of 24` is typed as `12*24`, and the field does the rest.

**Which fields.** The test is what the value *is*, and it is mechanical: would `+` or `-`
ever be part of a correct value, or must the value arrive exactly as typed? Then the field
is an identifier or a secret, and it is out.

| In | Out |
|---|---|
| Quantity, count, price, amount, discount, percentage, length, weight, duration in units | Phone, card, account and ID numbers, postcode, PIN, one-time code, password, year used as a label |

**What it accepts.** Digits, a decimal point, `+ - * /`, `( )` and spaces. Anything else
never reaches the value, as in F5. The point is accepted even in a whole-number field:
`2.5*4` is a whole number, and refusing the point as it is typed turns `0.1+0.2` into
`01+02` - a silent wrong number, the very defect this rule exists to stop. Whether the
answer is whole is a check on the answer.

**When it resolves.** On commit - Enter, Tab, or leaving the field - not per keystroke.
While an expression is being typed, the result shows beside it (`= 1250`) whenever it is
valid, and says nothing while it is not yet: `12*` is unfinished, not wrong (F2). On
commit the field holds the result, so what is saved is a number, never the expression.

**When it cannot resolve.** Keep the text, mark the field, and name the problem - a bracket
not closed, an expression ending in an operator, a division by zero, a result the field
does not accept (`10/3` in a whole-number field, `50-80` where a negative is refused).
Never round, clamp or clear to make the problem go away: each one saves a number the user
did not ask for, and none of them looks like an error.

**Typed over a selection.** F5 selects the value on entry, so the first keystroke replaces
it. An operator is the exception: `+`, `*` or `/` typed over the selected `1200` cannot be
the start of a new number, so it extends the value - `1200+50` - instead of replacing it.
`-` does the same where the field refuses negatives; where it accepts them, `-` starts a
new negative number as usual.

**How it is computed.** A parser that knows digits, the four operators and brackets, with
the usual precedence (`2+3*4` is `14`). Never evaluate the text as code in whatever
language the page runs: the field is then a way to run anything, one paste away. Round away
floating-point noise before showing a result - `0.1+0.2` is `0.3`.

**On a phone.** Keep the numeric keypad the field already raises. Where that keypad carries
no operators, the arithmetic is out of reach there and nothing is lost; switching every
user to a full keyboard to reach `+` costs everyone who only ever types digits.

**The test:** type `1200+50` and leave the field: it holds `1250`. Type `(2+3)*4`: `20`.
Type `10/0` and `5+`: both keep their text and say why. Select the value and type `+50`:
it extends. Type the same into a phone number field: nothing is evaluated.

### A field that is the wrong shape (rule F4)

Found on a phone, in a settings screen holding a WhatsApp message template: the message
was a one-line input. Typing `Hello ^duwddwz` still fit; a real message would not, and the
writer would be composing into a box showing four words at a time with the keyboard over
the rest of the screen.

The shape is decided by the content, not by the container it happens to sit in:

| The content | The field |
|---|---|
| A name, a number, a date, a single choice | One line |
| A message, a note, an address, a template with placeholders, anything with a line break in it | Multi-line, growing with what is typed, capped, then scrolling inside itself |
| Something long and structured - a description with paragraphs | The same, with a larger cap, and a way to see it whole |

Three things that follow, and are missed in that order:

- **It grows.** A fixed three-line box for a nine-line message is the same defect at a
  larger size: the writer still cannot see their own text.
- **Enter makes a line.** In a multi-line field, Enter is a paragraph break. If Enter
  submits, the content can never contain one, and nobody decided that - the single-line
  input decided it.
- **The echo wraps.** A preview, a summary line or a confirmation that repeats the value
  wraps it. Truncating the preview of a message the user just wrote tells them their
  message is wrong when it is not.

**The test:** paste four lines of real content into the field. If the field does not show
four lines, or Enter never produced them, the shape is wrong. On a phone, do it with the
keyboard open - that is the only state where this is ever encountered.

### Where it applies

The same three jobs on a phone, in the same code. The bar editor's New shortcut sheet used
to refocus the name box and do nothing else when it was empty - a silent refusal to save,
which is rule A1 as well as this one. It now runs the identical check the desktop form
runs, in a sheet instead of a panel.

---

## Appendix Q: The numbers (rules Y1, Y2, M1)

Three rules in this file used to say "enough contrast", "readable" and "short". Each of
those is a judgement the next person makes differently, so each one now has a figure. A
figure can be checked by a script; a judgement cannot, which is why the earlier versions
were never caught failing.

### Contrast

| What | Floor | Notes |
|---|---|---|
| Body text, placeholder text | 4.5:1 | Placeholders are the ones that get missed: they are usually set to the muted token, which was chosen against the page and not against the field |
| Large text (>=24px, or >=19px bold) | 3:1 | |
| A mark that carries meaning with no text | 3:1 | A chart series, a status dot, a focus ring, an icon-only button's glyph |
| Grid lines, dividers, chrome | none | These are allowed to be quiet; that is their job |

Two things this does not say. It does not say grey: on a coloured surface, secondary text
is that surface's hue held lighter or darker, because grey on a tint reads as dirt. And it
does not say light mode: dark mode is a separate measurement, not an assumption, and light
text on a dark ground also wants slightly more line height and a touch more tracking to
read the same (rule Y3, Appendix E).

### Type

- **Roles, not sizes.** Heading, body, label, metadata, data. Two roles whose size and
  weight are one step apart are one role with two names, and the hierarchy they were
  meant to express is not there.
- **Measure 45-75 characters.** Wider needs more line height; a narrow column needs less.
  There is no universal ratio, because the face decides.
- **A 16px floor** for body text, and for **any focusable input on a phone**. The second
  is not a readability preference: a mobile browser zooms the page when a smaller field
  takes focus, which moves the form out from under the finger that just tapped it. The
  cheapest layout bug in this file to prevent, and one of the more confusing to diagnose.
- **Tabular figures** wherever numbers stack: a table column, a total, a live readout, a
  timer. Proportional digits change width as the value changes, so a sorted column
  ripples sideways while it sorts and a readout jitters while it updates. Every platform
  has a tabular figure setting; it is set once, on the container.
- **Load what is used.** Weights that no role names are bytes spent to render nothing, and
  a font that blocks rather than swaps shows the user an empty page while it arrives.

### Motion

| Duration | For |
|---|---|
| 100-150ms | Acknowledging a press. Longer reads as latency, not as animation |
| 150-300ms | A routine state change: a toggle, an expand, a filter applying |
| 300-500ms | An overlay, a sheet, a view transition - a thing that moves a long way |
| 500ms+ | One authored moment on a page that has earned it, and nothing else |

Where something travels a distance rather than simply appearing, the shape inside the
duration is **2 : 1 : 2** - accelerate, hold, decelerate - so at 500ms that is 0.2s in,
0.1s across, 0.2s out. See Appendix W, which is where the travelling mark uses it.

Exit runs at roughly two thirds of entry: an exit as long as its entry feels like the
interface is reluctant to let go. Arrivals decelerate - a strong ease-out, not a linear
ramp; bounce and elastic are a decision, never a reflex. Move and fade before reaching for
anything else, because those are the two things every platform can animate without
recomputing layout, and where blur, shadow or a mask genuinely say something, bound the
region they run on.

Two mechanics that decide whether motion feels built or bolted on:

- **Interruptible.** A second click during an animation takes effect now. An animation
  that must finish before the UI listens again is a queue the user cannot see.
- **Visible by default.** The resting state of an element that animates in is *visible*.
  If the entrance is what makes it appear, a failed script, a blocked observer or reduced
  motion leaves a blank page - and the blank page looks like a bug in the data, which is
  where the next hour goes.

`prefers-reduced-motion` means a different transition, not no transition. A state change
still has to be legible when it is honoured; a global `* { animation-duration: 0.01ms }`
satisfies the setting and deletes the feedback that told the user their click landed.

---

## Appendix R: What arrives late (rule P1)

The layout audit (Appendix K) measures a page that has finished loading. Everything here
happens before that, and is invisible to it: the reader has already started reading when
the image, the font or the row arrives and moves what they were looking at.

### Reserve the space

Anything whose size is known before its content is gets its box first. The rule is
platform independent; only the name of the mechanism changes.

- Declare the shape up front - a ratio, or explicit dimensions - so the space exists
  before the bytes do.
- A skeleton is the **size of the thing it stands for**, not a generic grey bar. A
  skeleton of the wrong height is a layout shift with extra steps.
- Text renders in a fallback face and swaps, rather than hiding until its own face
  arrives, and the fallback is chosen for similar metrics so the swap moves as little as
  possible.
- Never insert content above something the user is already reading. A banner arriving at
  the top pushes the whole page down under a pointer that was already moving.

On the web these are a declared aspect ratio or explicit dimensions, and a swapping font
display. On a native platform they are the equivalent intrinsic size and the system face.
The failure they prevent is the same one.

### Do less work, later

- What is off screen loads when it approaches; what the user came for never waits.
- A list past a few hundred rows renders the rows in view and reserves the height of the
  rest, by whatever the platform calls that. Note the interaction with rule L6 and S1: a
  windowed table still sorts and filters over the **whole** set, not over the rows
  currently realised. Sorting only what is mounted is a subtle, very convincing bug.
- Scroll, resize and keystroke handlers are throttled or debounced - a search that filters
  on every keystroke of a large table is doing the work of the whole word to show the
  first letter.
- Read layout, then write layout. Alternating them inside a loop makes the browser
  recompute geometry on every iteration.

### Survive the content (rule P2)

| Situation | What breaks | What fixes it |
|---|---|---|
| A long name beside other controls | The row grows past its container and the page scrolls sideways | The text is the part allowed to shrink, and most layout engines will not take a child below its content width until told it may |
| A long word or an address | Overflows its box | Allow a break inside the word |
| A truncated description | Nothing says it was truncated | Truncate visibly, and keep the full text reachable - a tooltip, an expand, the row's own detail |
| A translated label | 30-40% longer than the English; German is the usual worst case | Size text containers by their padding, never by a fixed width |
| A date, a number or a price | Assembled by hand, wrong in half the world | The platform's locale formatter |
| "1 items" | Plural glued on from a condition | Take the plural from the count, through whatever the project uses for i18n |

The 375px pass in the README already catches the first two if the content is long enough.
It usually is not, because the mock data was written by whoever built the screen. Type a
sixty-character name into the row before calling it done.


---

## Appendix T: Coming back (rule N4)

A screen is usually built once, forwards. The way back is discovered by the user, and by
then it is someone else's bug report. Three separate things get lost, and they get lost
for different reasons.

### What has to survive

| | Lost when | Restored from |
|---|---|---|
| **Scroll position** | The list is rebuilt from the top on return | The position, recorded on leave, reapplied once the rows that give the list its height exist - not before, or it clamps to nothing |
| **The view state** | Sort, filters, expansions and search live only in memory | The same place the draw reads (rule V1). If the state is in the URL or the platform's equivalent, the reload case comes free |
| **What was typed** | A half-filled form is thrown away by navigation | Rule F3's draft |

The second row is the one that decides the other two. Where the view state is held in one
place that the draw reads and the address carries, restoring is reading it back; where it
is scattered across the handlers that set it, every path has to remember to save and
reapply, and the one that forgets is the one someone uses.

### Addressable

Any screen worth arriving at can be arrived at directly. That means a reload lands the
user where they were, a link sent to a colleague opens what the sender was looking at,
and a notification can point at the thing it is about. A screen reachable only by clicking
through three others cannot be shared, cannot be bookmarked, and cannot be recovered after
a crash - and users read all three of those as the product losing their work.

What is in the address is the state that identifies the view: which record, which tab,
which filters. What is not is anything secret, anything huge, or anything transient like a
hover.

### Never reset the way back silently

A navigation that clears the stack, jumps to a start screen, or replaces history without
being asked leaves the back control pointing somewhere the user never was. If a flow
genuinely has to end and start over - a completed checkout, a signed-out session - the
screen says so. Silence here is the same defect as rule A1's silent action, one level up:
something large happened and nothing told anyone.

### What this costs if skipped

The table rules (S1, Appendix A) make filters worth setting: several controls, a value
list, a range. That work is exactly what a return trip throws away. A table with a good
filter panel and no state restoration is more annoying than a table with neither, because
it asks for more effort before discarding it.

---

## Appendix U: The old numbers

Every rule in this file used to be a number between 33 and 86, assigned in the order it was
written. That order carried no information: rule 35 was about spacing, 36 about components,
37 about hierarchy, and the next spacing rule was 85. Fifty numbers in one flat list meant
finding a rule required either remembering it or reading all of them.

The identities are now a category letter and a position inside that category, so a citation
says where to look before you look. What a number never told you, `T2` does.

**A number is still an identity, not a position** - the principle at the top of this file has
not changed. What changed is that the identity now carries its category, and this table is
why the change is safe: **every citation written before the change still resolves, here.**
Nothing in this table is ever deleted, including for rules that are later removed.

Gaps in the old sequence: 40, 52 and 84 were merged into other rules during the review that
produced this regrouping (see the rules named below); 56, 57, 58, 75 and 76 were never
written at all.

| Old | Now |
|---|---|
| 33 | D1 |
| 34 | D2 |
| 35 | L2 |
| 36 | D3 |
| 37 | L1 |
| 38 | A4 |
| 39 | L7 |
| 41 | X1 |
| 42 | Y3 |
| 43 | M1 |
| 44 | K1 |
| 45 | D4 |
| 46 | D5 |
| 47 | V3 |
| 48 | A1 |
| 49 | D6 |
| 50 | B1 |
| 51 | B2 |
| 53 | L5 |
| 54 | T1 |
| 55 | T2 |
| 59 | T3 |
| 60 | N2 |
| 61 | L6 |
| 62 | B3 |
| 63 | X2 |
| 64 | A3 |
| 65 | T4 |
| 66 | V1 |
| 67 | V2 |
| 68 | Y2 |
| 69 | N1 |
| 70 | L8 |
| 71 | N3 |
| 72 | F1 |
| 73 | A2 |
| 74 | Y1 |
| 77 | P1 |
| 78 | P2 |
| 79 | L9 |
| 80 | F2 |
| 81 | N4 |
| 82 | F3 |
| 83 | X3 |
| 85 | L3 |
| 86 | L4 |

Three old numbers have no row because their rules no longer exist on their own:

| Old | Went into |
|---|---|
| 40 (responsive is not a later pass) | V3, which carries the width check that makes it enforceable |
| 52 (tokenise the chrome) | Y3, which now holds the single chrome list |
| 84 (blur the screen) | L1, as the test that decides it |

---

## Appendix W: The mark that says where you are (rule N5)

A navigation that highlights the wrong entry is worse than one that highlights nothing:
the reader believes it, and then has to work out why the page disagrees with it. Found on
this project's own reference page, on video, and every cause below was present at once.

### Four ways it goes wrong, and what each one looks like

| Cause | What the reader sees | The fix |
|---|---|---|
| **The mark is a separate element** - a sliding pill, an underline, a bar positioned from a measurement | It sits a few pixels off, or animates to where the item was, or drifts after a resize | The item's own background or weight. Nothing to keep in sync cannot fall out of sync |
| **The test asks "what has scrolled past"** rather than "what is being read" | The highlight is always one behind: the heading is on screen and the previous section is marked | Put the decision line a third of the way down the viewport, under any sticky bar. A heading that has reached there is what is being read |
| **The update is gated behind an animation frame** with a latch | The mark freezes on whatever it last saw, and never recovers until something else forces a paint | Whichever of the frame or a short timer arrives first clears the latch and paints; re-read the position when the tab becomes visible again |
| **Two destinations start within a screenful of each other** | The earlier entry can never be current: by the time its own content is being read, the later one is already past the decision line | Destinations are spaced further apart than the decision line, and a page with no separate section for something does not offer it as a destination. Containment is not the test - a group heading is a sibling of its sections, not their parent - the distance is |

### When the mark travels

A mark that jumps says where you are. A mark that travels also says where you came from,
which is what a reader loses when a whole panel changes at once. Travel is optional; doing
it badly is not cheaper than not doing it.

- **Tween from A to B: slow in, cruise, slow out.** Remember where the mark started, where
  it is going, and how far through it is, then interpolate between the two. The usual shape
  is **2 : 1 : 2** - at a 0.5s total, `0.2s` gathering speed, `0.1s` at speed, `0.2s`
  setting down - which is a trapezoid velocity profile, and the position is its integral.
  The flat middle is what makes distance legible: a curve with no cruise spends the whole
  journey changing speed and reads as rubbery over a long gap. A constant fraction of the
  remaining distance per frame is *not* this - it only ever eases out, leaving at full
  speed and creeping in.
- **A long travel is a different story from a short one.** Across a neighbour, 2:1:2 is
  right. Across a whole list it reads as laboured, because the mark spends the entire
  journey changing speed. Far travel leaves slowly, gathers real speed, runs **about 5%
  past** where it is going, and is pulled back to a stop. The overshoot is what makes the
  arrival read as *something stopping* rather than *something being switched off* - the
  same pull-back the ends of a list use, doing a different job. Measured on the reference
  page, a 1258px travel runs `0, 1, 3, 10, 16, 23, 42, 53, 65, 94, 104, 101, 100` percent
  of the distance; an 84px one runs `0, 2, 7, 29, 45, 60, 87, 95, 99, 100` and never passes
  its target.
- **Pick the profile by distance, not by component.** Somewhere around a quarter of the
  container's length is the switch. Duration follows distance too, but not proportionally:
  past roughly three quarters of a second the reader is waiting rather than following, so
  it is capped.
- **Interruptible, and from where it actually is.** A second destination mid-flight starts
  a new tween from the mark's current position, never from where the last one began, or it
  jerks backwards before going forwards (rule M1: an animation the user can interrupt).
- **Read the target's box every frame, from the element itself.** That is what keeps a
  travelling indicator inside rule N5 rather than becoming the second source of truth the
  rule exists to forbid.
- **Move on `transform`.** Position and size come from a translate and a scale, never from
  `left`/`width`, or the travel is a layout recalculation per frame (rule M1, and lesson
  17 in Appendix Z for what a stalled layout transition looks like).
- **The ends give a little.** Arriving at the first or last entry, overshoot by about five
  pixels along the direction of travel and settle back. That is the whole of the "there is
  nothing past this" signal - no text, no disabled state, nothing anyone would call an
  animation. It is felt rather than read, which is why it works at the edge of a list
  someone is scanning quickly.
- **Give way to reduced motion.** Place it instantly. The state change still has to be
  visible; only the travel goes.
- **Whichever axis the nav is using.** A nav that turns vertical at some width (rule L10)
  has a mark that travels vertically there, and the give follows the same axis. Ask the
  element which way it is laid out; do not infer it from the breakpoint.

### The second and third are the ones that get shipped

The first is visible in a screenshot, so it gets fixed. The fourth is caught by the first
person who clicks. The middle two are the ones that survive review: both look perfect when
the developer scrolls slowly and deliberately, which is exactly what a developer does when
checking. The lag only shows at reading speed, and the freeze only shows in a tab that was
in the background - neither is a state anyone tests on purpose.

### The check is a sweep, not a glance

Every destination, in order: go to it, then read the mark. One wrong entry out of fourteen
is invisible to a person checking two or three, and it is exactly what this page had - the
motion entry lived inside the theming section, so theming could never be marked and nobody
noticed until the whole set was swept.

**Two tests, because they catch different things.** The first is arithmetic and runs in a
moment: measure the distance between each pair of consecutive destinations and compare it
against the decision line - anything closer names an entry that can never be marked, before
anyone has scrolled at all. The second is the sweep: go to each destination in turn and
assert the mark landed on it. The sweep has to allow for the paint being asynchronous, so a
check that reads the mark in the same tick that moved the page will report every entry as
broken and be wrong; wait for it to settle. And a programmatic scroll does not always emit
the event the handler listens for, so a sweep that passes by setting a scroll position can
still be broken for a human - dispatch the event, or scroll for real.

---

## Appendix Z: Twenty-five things not to do, each one learned the expensive way

Every item below was done - by a model, while building the reference page for these very
rules, often within an hour of writing the rule it broke. They are here as instructions,
not as history: a fresh model reading this file should treat each one as a habit to have
before starting, because none of them announce themselves while you work. The failures
all passed some check, looked right in a screenshot, or were invisible until a person
pointed at them.

### Writing rules

**1. Never write a rule as a judgement.** "Enough contrast", "generous spacing",
"production-ready" cannot fail a check, so they are never caught failing - they are
opinions wearing a rule's clothes. Every rule states a figure, or an observation someone
can run in seconds. If you cannot state one, what you have is a principle; put it where
principles go.

**2. Never state the same figure twice.** The moment a number lives in a rule *and* an
appendix, they are two facts that will disagree. The figure lives in one place and
everything else points at it. The same goes for a scoping exception: state it where it
belongs, then point.

**3. Never add a rule for a defect an existing rule already covers.** A recurrence needs
an assertion, not a firmer sentence. Adding a number makes the set longer without making
any screen better, and length is what stops a rule set being read at all.

### Writing the code

**4. Never write a raw colour, and be most suspicious right after you fix one.** `#fff`
on an accent surface measured 2.3:1 in dark mode - written into the page an hour after
the identical defect was fixed in the docs. What you just studied is what you are most
likely to type. Every colour is a token, and a foreground that sits on a coloured surface
has its own token for that pair.

**5. Never set spacing on one element and leave its sibling.** A note at 1px and a body at
16px gave one box two left edges, and it survived every automated check for days because
nothing measured alignment. Elements inside a box share one inset, set once on the box.

**6. Never pin a box to both edges of the screen to make it stretch.** A rail pinned top
*and* bottom held 288px of empty box below its last item and advertised a scroll it never
had. A box is the size of what is in it; cap it with a maximum, not with two anchors.

**7. Never put an override before the rule it overrides at equal specificity.** A touch
target rule sat above its own base rule, so the base won and every target on a phone was
26px. Specificity ties are decided by source order, and the override goes last.

**8. Never build an escape sequence inside a non-raw string.** `'\2191'` is an octal
escape in most languages: it wrote a control character into a generated stylesheet, where
it rendered as nothing and explained nothing. Generate the character at runtime from its
code point, which also keeps the source ASCII.

**9. Never run a scripted edit without asserting how many times it matched.** One
unbounded replace added closing tags to sixteen tables it had never opened. A scripted
edit that matches nothing, or matches more than intended, must fail loudly at the moment
it runs - not at the moment someone notices the page is malformed.

### Deciding what is "current", "active" or "selected"

**10. Never decide "current" by what has scrolled past.** A line at the top edge marks a
section only once its heading has gone, so the highlight is always one behind - and it
looks perfect to whoever tests it, because a developer scrolls slowly and deliberately.
The line belongs where reading happens, a third of the way down.

**11. Never let one asynchronous source be the only path to a repaint.** An update gated
behind an animation frame, with a latch, freezes forever in a tab that never gets a frame.
Whichever of the frame or a short timer arrives first does the work, and returning to the
tab re-reads the state.

**12. Never offer a destination that sits inside another destination.** If two entries
start within a screenful of each other, the earlier one can never be marked. A page with
no separate section for something does not list one.

### Checking

**13. Never trust a green check to mean the thing works.** A check proves exactly what it
asserts and nothing else: the layout audit said "clean" through every one of the defects
above, because it measured overflow, clipping and target size - not alignment, not
contrast, not whether the right thing was highlighted. Before trusting a check, break what
it guards and watch it fail. A check that has never failed is a decoration. The purest
case: the modal lock was checked with `paddingRight >= 0` - true of every element that has
ever existed - and it passed a lock that widened the page by 16px. The assertion has to
measure the claim ("the page did not move"), not a property near it.

**14. Never believe a measurement without checking the instrument.** Numbers were read
from a viewport reporting `innerWidth: 0`, and from a hidden tab where the frame that
paints never comes; both produced confident, wrong conclusions and one produced a
"defect" that did not exist. Before measuring: is the surface visible, does it have a
size, and did the thing being measured have time to settle? An asynchronous paint read
synchronously will report everything as broken, and be wrong every time. And is it the
page you think it is: navigating to a URL that differs only in its `#hash` is a jump
within the page, not a load, so a whole round of checks once ran against the version from
before the fix and reported every fixed defect as still there. Likewise a check started while another was still scrolling the page reported
fields "moved" by 26,000px, and a halo read in the middle of a transition reported "none":
measure on a settled page, with transitions switched off.

### Two more, found by a person looking at the screen

**15. Never reference an asset without asserting it resolves.** The section teaching
"every button leads with an icon" referenced three icons that were never defined, so it
drew three empty boxes - text-only buttons in the sample meant to show icons. Nothing
failed: a missing `use` target renders nothing, silently. Every reference to a sprite, a
token, a font or an id is asserted to resolve, or it is a citation to a rule that does not
exist (29c) wearing a different hat.

**16. Never let a control's own label decide the container's size.** A rail sized to fit
short labels clipped the one long label, and the highlight ran past its own box. Either
the label wraps, or the container is sized by the longest label, but the label is never
the part that silently loses. See P2, which is the same rule about a row.

**17. Never transition a layout property, and know what a stalled transition looks like.**
Animating `width` on a rail broke M1 - and the way it failed is the part to remember. In a
tab that receives no frames the transition stays `running` forever, and a running
transition's value beats every declaration, including an inline `!important`. The box read
54px no matter what any rule said, which looks precisely like the browser ignoring your
CSS, and sends you hunting through specificity for an hour. `transform` cannot do this: it
never changes layout, and a frameless tab simply shows the end state. When a computed value
refuses to match any rule you can find, ask the element what it is animating
(`el.getAnimations()`) before you touch the stylesheet again.

**18. Never judge an animated state in a surface that cannot animate.** The same pane that
froze the transition also reports every mid-flight value as final, so a correct rail looked
broken in six different measurements. Test the end states with the transition switched off,
and test the animation somewhere that paints.

**19. Never test a focus behaviour without first taking the focus away, and never trust a
focus test in a window that is not the focused window.** Both were done in one afternoon,
against the same working field. Calling `focus()` on a field that already holds the focus
fires nothing, so the check read a stale selection and reported a correct field as broken.
The second run blurred first - and still failed, because an unattended browser pane is not
the focused window, and there `focus()` moves `activeElement` without dispatching a single
`focus` event. Neither failure looks like an instrument problem: both print a confident
sentence about the field. The test is `document.hasFocus()`, before believing anything a
focus handler was supposed to do.

**20. Never compensate by overwriting; add to what is there.** Locking the scroll removes
a 10px scrollbar, so the lock gives 10px back as padding - and did it by *setting* the
body's right padding to 10px, over a 16px gutter that was already there. The page grew
16px wider the moment a modal opened, which is the shift the lock was written to prevent,
and a full-bleed bar ran 6px off the screen. Any value that pays something back - padding
for a scrollbar, an offset for a fixed header, a margin for a keyboard - is read first and
added to.

**21. Never check an interaction at one width only.** This file states a 16px floor for
every field on a phone; the reference page built from it had 55 fields, all at 13px, so
every one zoomed the page on tap. Its thirteen chart filters jumped up to 500px while
typing, because at phone width the chart stacks above the table it filters, and a
keystroke that removed rows shortened it. Neither defect exists at desktop width, which is
where every check had run. Run each check at phone width as well, and type into things -
a layout that is correct at rest can still move under the finger.

**22. Never let the always-loaded summary of a rule be weaker than the rule.** S1 said "a
filter per column"; T1, twenty pages away, said a text box is not a filter. Agents read the
short line - it is the one that is always in context - and shipped an empty typed box under
every header, satisfying S1 to the letter, in project after project, while T1 sat unread
behind an open-the-skill, route-to-T, read-Appendix-A path. The summary is the rule for
anyone who never follows the pointer. Where a rule is restated in a shorter, always-on form,
that form carries the clause that separates the right reading from the cheap one - here, the
definition of the word "filter" - and a check that fails the cheap reading.

**23. Never ship a reference sample that fails the check written for it.** The reference
page drew its filter row with a line under the titles and 2px above each filter - on every
one of its 31 filtered tables - while the rule beside it called the filter row "a separate
band". Builders copy what a sample renders, not what its sentence says, so the defect spread
to every project built from it. The measuring check was written from the complaint; run on
the sample it failed 62 times before the sample was fixed. Run each new check on the
reference first: if the reference fails it, the reference is the next fix.

**24. Never verify a colour in one theme, or by looking.** Two samples were judged by eye in
the dark theme and were wrong in ways a glance does not catch. The Y2 backing plate's label
was near-black on a near-black plate - 1.04:1 against the 4.5:1 the rule states - because its
text colour was the one for text *on the accent*, which is dark in that theme. And the new
selection ring was one colour: near-white, 13.8:1 against the page but 1.5:1 against a mint
wedge; near-black in the light theme, 17:1 against the page and 1.2:1 against a black mark. A
colour has no contrast of its own, only a ratio against what is behind it, and what is
behind it changes with the theme and with the mark. Measure the ratio against everything it
can land on, in both themes, and assert a figure (3:1 for a marker, 4.5:1 for text). A
highlight that has to read on any fill is two-tone: a ring in the surface colour beside the
mark, a ring in the text colour outside it, so one of the two always contrasts. A third time: the
hover halo of B4 was the pale accent tint, 1.14:1 against the surface in both themes, while the
rule beside it said the same ring is the focus indicator; it was found only by measuring it
after seeing it in a render.

**25. Never reference a token you have not seen defined.** `var(--fg)` appeared 17 times on a
page whose token was `--text`. An undefined custom property raises no error: the whole
declaration is dropped. Two focus rings (`outline: 2px solid var(--fg)`) had never drawn, and
every new rule written with the same wrong name silently did nothing. Before using a token,
find where it is defined; the audit now fails any `var(--x)` that nothing declares
(`UNDEFINED TOKEN`).

### And the one that costs the most

**Never diagnose from the rule you happen to know.** Shown a screenshot of a defect, the
first two answers here were a contrast failure and a line-length failure - both real rules,
both confidently argued, both not what was on the screen. The third answer came from
measuring the thing in the picture, and it was a padding of zero. Reach for the measurement
before the explanation: the rule that fits the symptom is not evidence that it caused it.
