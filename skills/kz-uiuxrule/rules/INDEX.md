# Rule Index: what to read for the task in front of you

the project README (the reference page and the browser checks in the project this corpus came from (not carried in this package)) lists the **documents**. This file lists the **rules**, grouped by
the job being done, so a task can pull the three or four sections it needs instead of
reading three thousand lines of rules to find them.

**How to use it:** find the row in *Route by keyword* whose words match the task, read the
sections it names, and run the checks in that category's block. Nothing else in the corpus
applies unless the work touches a second category, in which case read that one too.

> **Packaged copy.** This is the rule corpus on its own. The project it came from also
> holds a live reference page (`ui-rules-visual.html`) and three browser-console checks
> written against it (`layout-audit.js`, `state-check.js`, `rules-check.js`). Where a
> section below says "Check:", that is the check to run if you have those files; the rule
> stands without them. The three that work on any page - `layout-audit.js`,
> `typing-check.js` and `table-check.js` - ship in the `kz-uicheck` sibling skill,
> `../../kz-uicheck/checks/`.

**Always read, whatever the task:** engineering rules L0 (1-9) and the two standing rules
S1 and S2 in [engineering-rules.md](../../kz-engrules/rules/engineering-rules.md). They are short and they are not
scoped out by anything.

> Rules are cited by their category identity - `T2`, `V3`, `C15`, `S1`. A citation written
> against the old numbers resolves through Appendix U of [ui-rules.md](ui-rules.md), which
> keeps every old number permanently.

---

## Route by keyword

| If the task says | Category | Go to |
|---|---|---|
| table, list, grid, rows, sort, filter, search, pagination, export | Tables | [T](#t-tables-and-columns) |
| chart, graph, plot, axis, legend, series, KPI, dashboard, data viz, timeline, funnel | Charts | [C](#c-charts-and-data) |
| form, input, field, validation, required, submit, draft, wizard, steps, regex, pattern, email, phone, postcode, quantity, price, calculator, math, textarea, select on focus, typing, keyboard closes, caret jumps, screen jumps, zoom on focus, re-render | Forms | [F](#f-forms-and-input) |
| button, delete, remove, clear, reset, save, toast, undo, confirm, loading, progress, hover, halo, clickable, affordance | Actions | [A](#a-actions-and-feedback) |
| modal, dialog, dropdown, popover, tooltip, sheet, drawer, menu, tab, route, back, deep link | Overlays and navigation | [N](#n-overlays-and-navigation) |
| layout, responsive, breakpoint, mobile, phone, safe area, bottom bar, scroll, overflow, column | Layout | [L](#l-layout-spacing-and-the-mobile-shell) |
| colour, contrast, dark mode, theme, token, font, typography, size, spacing, shadow, elevation | Type, colour, theming | [Y](#y-type-colour-and-theming) |
| animation, transition, motion, reduced motion, duration, easing | Motion | [M](#m-motion) |
| slow, performance, lazy, skeleton, virtualise, jank, layout shift, images, fonts loading | Performance | [P](#p-performance-and-what-arrives-late) |
| accessibility, a11y, screen reader, keyboard, focus, aria, label, i18n, translation, RTL | Accessibility | [X](#x-accessibility-semantics-and-language) |
| copy, wording, label, message, error text, empty state, explainer, tooltip text | Copy | [K](#k-copy-and-explainers) |
| new component, design system, tokens, "make it look right", styling | Design system fit | [D](#d-fitting-the-design-system) |
| done, review, verify, check, ship, test | Close-out | [V](#v-before-calling-it-done) |
| refactor, architecture, naming, dependency, commit, scope | Engineering only | [E](#e-engineering-non-ui) |

If two rows match, read both. If none match and the work changes how something **looks,
behaves, moves or is interacted with**, read [D](#d-fitting-the-design-system) and
[V](#v-before-calling-it-done) at minimum.

**The section letter is the rule letter.** Section T holds the rules called `T1`, `T2`, `T3`;
section Y holds `Y1` to `Y3`. A rule cited anywhere in the corpus can be found by reading its
first character and coming here. Two sections carry no rules of their own: **C** points at
[chart-rules.md](chart-rules.md), and **E** at [engineering-rules.md](../../kz-engrules/rules/engineering-rules.md).
Rules appearing under a section that is not their own letter are cross-references, and are
marked as such by their identity.

---

## T. Tables and columns

**Rules:** S1 (standing), T1, T2, T3, T4, L6, V1, P2, N4.
**Read:** [ui-rules.md](ui-rules.md) Appendix A (the standard table pattern - filter panel,
value lists, counts, totals), Appendix L (bounded height and expand), Appendix T (what
survives coming back).
**Also:** [chart-rules.md](chart-rules.md) C2 and C10 if anything on screen plots these rows.
**Check:** `../../kz-uicheck/checks/table-check.js` (fails a filter that is a text box, a column with no filter, no sort, a filter glued to a header line - run it on ANY page), `state-check.js` (drives every table to 0, 1 and all rows, sorts every column).
**The three most often missed:** a filter that is a single text box rather than a panel
(T1); a computed column with no filter because the value only exists inside the formatter
(T2); totals summed from the formatted strings rather than the source values (Appendix A).

## C. Charts and data

**Rules:** C1-C21 in [chart-rules.md](chart-rules.md), plus UI rules B3, X2, V1, Y2.
**Read:** chart-rules in full for a new chart - it is one document and it is the shortest
path. For an edit to an existing chart, C2 (chart follows its table), C15 (legend built
inside the draw), C19 (rows not drawn say so), C14 (readout reports what is plotted).
**Check:** `state-check.js` - it asserts chart, count, totals, readout and legend all still
agree after every control is touched.
**The trap:** anything computed at load rather than inside the draw is stale the moment a
filter moves (principle 12, C15, rule V1).

## F. Forms and input

**Check:** `typing-check.js` at phone width (F8), `rules-check.js` for the samples.
**Rules:** F1 (required fields), F2 (when a field validates), F4 (the field's shape follows its content), F5 (a digit-only field selects on entry), F6 (arithmetic in an amount field), F7 (one anchored pattern per field, used everywhere), F8 (typing is never interrupted), F3 (drafts, steps, error
summary, undo), A4 (every state), K1 (copy).
**Read:** [ui-rules.md](ui-rules.md) Appendix P (the mark, the nudge, the block).
**Also:** J for labels and announcements, D for what submit does.
**The trap:** validating on keystroke instead of blur, a summary of errors that names
fields instead of linking to them, and a pattern so strict it rejects a real name.

## A. Actions and feedback

**Rules:** S2 (standing - destructive behind a confirm that names the target), A1 (no silent
action), A2 (a repeated message counts, it does not restack), B3 (a control that cannot act
is not a button), B4 (everything that acts answers the pointer with the same halo), A3 (a control that clears, clears everything it claims).
**Read:** Appendix B (action feedback, toast anatomy, position, stacking).
**The trap:** the toast that reports more than the action did (A3), and re-adding a toast
that is already on screen instead of counting it (A2).

## N. Overlays and navigation

**Rules:** N2 (when a dropdown closes), N1 (a modal claims the screen - four separate
things), L8 and N3 (the mobile shell and its bars), N4 (coming back is a state).
**Check:** `popover-check.js` (opens every dropdown and closes it four ways).
**Read:** Appendix J (when a popover closes, and every way out), Appendix N (the four things a modal owns and
the scroll lock that is always the missing one), Appendix O (the mobile shell, bar
measurement, the arrange screen), Appendix T (scroll, view state, addressability).
**Check:** `state-check.js` asserts nothing behind an open modal scrolls, focuses or clicks.

## L. Layout, spacing and the mobile shell

**Rules:** L2 (spacing from a scale), L7 (survive content), V3 (verify the layout, which
absorbed the old responsive rule), L5 (controls in a row share one height), L6 (bounded
height), L8 and N3 (mobile shell), P2 (text longer than the mock), L1 (hierarchy and the
blur test), L3 (spacing is a rhythm), L4 (depth), L9 (what the user holds at once).
**Read:** Appendix F (control sizing, and never `display: flex` on a table cell), Appendix K
(the layout audit and why the same failures recur), Appendix L, Appendix O.
**Check:** `layout-audit.js`, at a wide width, a narrow one, and **375px with touch
emulation** - only the last exercises tap-target size.

## Y. Type, colour and theming

**Rules:** D2 (no raw values where a token exists), Y3 (a theme is derived from tokens and
covers the chrome, scrollbar included), Y2 (contrast decision, with figures), Y1 (type is a
role scale), L4 (depth comes from light).
**Read:** Appendix E (the chrome that gets forgotten - scrollbar, selection, caret, focus
ring, placeholder, autofill), Appendix Q (the figures: contrast floors, measure, tabular
figures).
**The trap:** dark mode measured by assumption rather than measured at all, and grey
secondary text on a coloured surface.

## M. Motion

**Rules:** M1 (functional or absent, with the duration bands), D6 (no generic styling).
**Read:** Appendix Q, motion section - durations, exit faster than entry, interruptible, and
why the resting state of an animated element must already be visible.
**The trap:** honouring reduced motion by deleting the feedback rather than replacing the
transition.

## P. Performance and what arrives late

**Rules:** P1 (reserve space, load what is near, window long lists, throttle handlers), A4
(loading state), L7 (survive content).
**Read:** Appendix R.
**Note the interaction:** a windowed table still sorts and filters over the whole set, not
over the rows currently realised (A, S1).
**The trap:** a skeleton of the wrong height, which is a layout shift with extra steps.

## X. Accessibility, semantics and language

**Rules:** X1 (keyboard and semantics from the start), X2 (an accessible name states that
element's own values, on the element that takes focus), Y2 (contrast), F1 (required fields
announced), X3 (start and end, not left and right), V1 (paint state from the state, so
`aria-sort` and `aria-pressed` are never left behind).
**Read:** Appendix M rules X2 and X2-part-two, Appendix Q contrast table.
**The trap:** a perfect description on an element nobody can focus, and an `aria-label` built
from a shared value rather than the row's own.

## K. Copy and explainers

**Rules:** K1 (copy is part of the design), B2 (every button is explainable), T3 (every
column explains itself), A3 (a label is derived from what the control does), B3 (a key says
what it is).
**Read:** Appendix D (buttons, tooltips and the `[?]`, and which explainer by pointer type).
**The trap:** a label that is right for the person who wrote it and wrong for the person
reading it (X2, Appendix M).

## D. Fitting the design system

**Rules:** D1 (find the design system first), D2, L2, D3 (compose before building), D4 (match
surrounding UI), D5 (production-ready unless told otherwise), D6 (no generic AI-default
styling), L1 (hierarchy before decoration), L9 (count what the user holds at once).
**Read:** the precedence ladder at the top of [ui-rules.md](ui-rules.md) - the project's own
rules beat this corpus - and Appendix C (generated-UI tells).
**Note:** these documents never pick a style. Which palette, which face, how bold is a
project decision recorded where the project's rules live (see README).

## V. Before calling it done

**Rules:** V3 (verify the layout, not only the behaviour), V1 and V2 (render the truth on
every path), engineering 29, 29a, 29b, 29c, 30, 32.
**Read:** [design-principles.md](design-principles.md) close-out checklist, Appendix K.
**Run:** `layout-audit.js` at three widths, `state-check.js` and `rules-check.js`, served - not opened from
disk, and with the cache buster (see README).
**The rule about the check itself:** a check has to be shown failing before it is trusted
(29a), and it must be the file you just edited that ran (29b).

## E. Engineering (non-UI)

**Read:** [engineering-rules.md](../../kz-engrules/rules/engineering-rules.md) only. L0 (1-9) always; L1 (9a-32) for
any code work: root cause before fix, trace every caller, the second one is a parameter and
the third is a bug, smallest correct change, no unrequested abstractions.
**Nothing in [ui-rules.md](ui-rules.md) or [chart-rules.md](chart-rules.md) applies** to work
that does not change what the user sees or does.

---

## Coverage gaps

Rules with no section in this index are rules with no category, which is a smell in one of
the two. Every UI rule now carries its category in its identity, so the check is mechanical:
each letter's rules appear under at least one section above. If a rule is added, it is added
to a category here in the same change.

## Open questions

- L2b (modifying existing UI) does not exist yet, so every category above is written for
  new work. On an edit to an existing screen, the project's existing pattern wins (rule D4
  and the precedence ladder).
- No category yet for dashboards as a whole: today a dashboard is B plus A plus F, read
  three times, which is probably one category short.
