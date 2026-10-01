# Design Principles

The rules in [ui-rules.md](ui-rules.md) and [chart-rules.md](chart-rules.md) say *what* to
do. This file says *why*, and it is written from the corrections made during the build of
`ui-rules-visual.html` (the reference page and the browser checks in the project this corpus came from (not carried in this package)) rather than from theory.

Each principle below is followed by the corrections that produced it. They are here so the
principle can be argued with, and so a new rule can be checked against the thinking behind
the old ones rather than bolted on.

---

## 1. A pattern applied once is applied everywhere

The most frequent correction by a wide margin. Not "this screen needs X" but "every screen
needs X, starting now".

> "all of them same" - "this rule should apply to all ui" - "these mistake still there
> can't be clicked" - "instead of check emdash rule why not hook it"

**What it means in practice**

- A behaviour built for one table belongs in the shared table component, not in that
  table.
- When a control gains a capability, every sibling control gains it in the same commit.
  The bullet chart having hover but no click was a defect the moment the other five had
  both.
- Consistency beats local optimisation. A slightly worse pattern used everywhere is better
  than a better pattern used once, because the reader learns one thing instead of six.

**The test:** can you name a second place this should apply and have not done it? Then it
is not finished.

**And the harder one**, because the failure is never "I forgot". It is "I had a reason".
The legend interaction was asked for five separate times, and each time it went into seven
charts and not the other four, with a comment in the code explaining why those four were
different. The reason was always locally true and globally wrong. So: **when you are about
to write down why this case is the exception, that is the moment to check whether the
exception is doing any work.** Usually it is protecting one variant of the action, not the
action itself.

---

## 2. Derive it, do not decide it

Any choice made by hand at build time will go stale, be forgotten in the next component,
or be wrong for data nobody anticipated. Push the decision into the code so it cannot be
skipped.

> filter control type derived from the column's data - chart measures derived from the
> table's numeric columns - granularity derived from the span - label collapse measured
> rather than set at a breakpoint - the ASCII rule enforced by a hook rather than a check

**What it means in practice**

| Hand-picked | Derived |
|---|---|
| `filter: 'text'` per column | numeric -> range, low cardinality -> list, else text |
| A hard-coded measure list | the table's numeric columns |
| "3Y shows months" | the coarsest bucket that stays under 40 marks |
| A 560px breakpoint | measure the row, compact only if it overflows |
| "remember no em dashes" | a PostToolUse hook that rewrites them |

**The test:** if someone adds a column, a range, or a language tomorrow, does the thing
still behave correctly without being told?

---

## 3. Nothing appears without explaining itself

If the reader has to guess what something is, the interface has failed, however pretty it
is.

> "whats the line for Idk" - "should have tooltip and says click to {action}" - every
> column gets a `[?]` - a delta names its comparison period - "Something went wrong" is
> never acceptable

**What it means in practice**

- Every mark on a chart has a legend entry, including the ones that are not series:
  targets, bands, zero lines, connectors, partial-period hatching.
- Every column header carries a one-line explainer.
- A control says what clicking it will do, in the direction it will go: "Click to hide
  Revenue", not "Toggle Revenue".
- Numbers state their unit and their comparison. "up 12%" is unreadable; "up 12% vs
  previous month" is not.

**The test:** point at each distinct element and ask where the page says what it is. If the
answer is nowhere, it is not finished.

---

## 4. Affordance must match behaviour, exactly

Something that looks clickable and is not is worse than something plain. Something that is
clickable and does not look it is invisible.

> legend entries that looked like the interactive ones but did nothing - a Clear button
> that moved away as the pointer approached it - a `[?]` too small to tap - `hidden`
> silently overridden so an empty control stayed on screen

**What it means in practice**

- If it can be switched, it is a button with `aria-pressed` and a hover state.
- If it is a key rather than a control, it is visually distinct, muted, with no hover
  affordance.
- A control must not depend on a state that reaching for it destroys.
- On touch, tap targets are 44px even when the glyph is 16px.

---

## 5. Dense, but never cramped

Two corrections that look opposite and are not: more information per screen, more air
around each piece of it.

> "looks too busy" - "the bar thickness can smaller by 50% but the text can keep" - "they
> can have a little bit bigger gap between bars" - "the text in the button too big, their
> size should be like the searchbar placeholder"

**What it means in practice**

- Reduce ink, not information. The bars got thinner; no value was removed.
- Rhythm comes from one spacing scale and one control height, so density reads as
  deliberate rather than accidental.
- Text sizes match their neighbours. A 16px button label beside a 13px field looks broken
  even when both are 32px tall.
- Remove decoration before removing data: the coloured stripe, the duplicate badge, the
  swatch that carried no information.

---

## 6. Space is a resource: no dead space, no runaway growth

> "default shouldn't give so many empty space for the left side, it should do scroll down
> instead" - "13 rows can put in 1 row together" - "no need to split 2 rows" - "unless the
> screen very [small] but the current one I gave you got plenty of space"

**What it means in practice**

- In a multi-column layout, a region that can grow is bounded and scrolls, with an expand
  control. One column must not stretch the row and strand its neighbour.
- A toolbar stays on one line; labels collapse before the row wraps.
- But do not economise where there is room. Collapsing labels on a wide screen is the same
  error in the other direction.

**The test:** at the width the user actually has, is any area empty for no reason, and is
any area overflowing?

---

## 7. Show the truth, including the awkward parts

Every data-display rule here exists because a plausible-looking chart can be wrong.

> shared scales so a target marker cannot exceed its track - totals computed from source
> values, never by summing rounded percentages - partial periods drawn differently and
> labelled - OHLC aggregated as first/max/min/last, never averaged - "over target is not
> automatically good" - empty buckets rendered rather than skipped

**What it means in practice**

- A number that is a percentage of something states the denominator.
- A chart that shows part of the data says so, rather than looking like all of it.
- Ambiguity is resolved toward the reading that is harder for us, not easier. Over-claiming
  against a contract is stated as a variance, not coloured green.

---

## 8. Defaults carry more weight than options

The right default removes the need for the option. The wrong default makes the option
mandatory.

> filters apply live, with no Cancel and no OK - expand appears only when there is
> something to expand - granularity is automatic with a manual override - the measure
> picker starts on the measure that answers the chart's question

**What it means in practice**

- Optimise the path where the user changes nothing.
- An option that everyone must change is a broken default.
- Reversible, instantly visible actions do not need confirmation. Destructive ones always
  do.

---

## 9. Every defect becomes a rule

Consistently asked for after each fix, in preference to just taking the fix.

> "record this down too" - "should have rule on that" - "update all the rule that you
> mistake" - "this rule applies when there's 2 columns or more"

**What it means in practice**

- The fix goes in the code; the reason goes in the rules; the recurrence check goes in a
  tool or a hook. **The third one is the one that matters.** A sweep of this page found
  fourteen fresh breaches of rules that were already written down, two of them in code
  written an hour after the rule. Writing it down is necessary and it is not sufficient;
  if a class has come back once, it needs an assertion, not a firmer sentence.
- Rules get scoped when they are too broad. "Bound anything that grows" became "bound it
  when something sits beside it", because a single full-width column is fine.
- A rule that keeps being departed from is wrong and gets rewritten, not overridden
  repeatedly.
- **And sometimes a defect becomes nothing.** Not every fix earns a sentence. If the defect
  was a typo, if the existing rule already covered it and was simply not followed, or if the
  new rule would only restate one already written, the correct output is the fix and an
  assertion - a rule number added in that situation makes the set longer without making any
  screen better, and length is what stops the set being read.

---

## 9a. No control may depend on state that using it destroys

Discovered three times independently, in three different components, before anyone noticed
it was one law: a filter panel that closed because the redraw it triggered rebuilt its own
markup, a legend entry that vanished when it was switched off, and a readout that could not
be clicked because the panel holding the control was click-through.

**What it means in practice**

- Before shipping a control, ask what using it changes, and whether the control is inside
  what it changes. If it is, it needs identity that survives the change.
- The same question catches the whole class: a Clear that removes itself, a "show more"
  inside the region it collapses, a sort control in a header that the sort re-renders.
- The fix is never "redraw less". It is to give the control a life independent of the thing
  it acts on.

**The test:** use the control twice in a row without touching anything else. If the second
use is impossible, the control depends on state its own first use destroyed.

---

## 9b. A figure, not a judgement

Three rules in the UI set said "enough contrast", "readable" and "short" for months. None
of them was ever caught failing, because a judgement cannot fail a check - only a person can
disagree with it, and people do that quietly by not raising it.

**What it means in practice**

- A rule that describes a quality states the figure that quality bottoms out at, or names
  the observation that decides it. "Generous" is not a rule; "more space above a heading than
  below it" is.
- The figure lives in exactly one place, and every rule that needs it points there.
- If no figure and no observation can be stated, the sentence is a principle, not a rule,
  and belongs in this file rather than in a numbered table.

**The test:** could someone write a check that fails when this is broken? If not, nobody
will ever be told it is broken.

---

## 9c. A figure derived from a subset says so where the figure is

Found in the chart rules and true well outside them: a total computed over the rows a legend
toggle had withheld, displayed as though it were the total.

**What it means in practice**

- The caveat sits at the number, not in a footnote, a tooltip or an appendix. Someone reading
  the number is not reading anything else.
- It names what was excluded and how much: "3 of 12 sites hidden", not "filtered".
- This covers table footers, counts, KPI tiles and export files, not only charts.

**The test:** hide something, then read every number on the screen. Each one either changed or
said why it did not.

---

## 10. Judge the rendered result, not the claim

Every defect in this build was found by looking at the actual screen, and most of them
passed their behavioural checks first.

> screenshots of the real page, repeatedly - "you see each of them length different how can
> we visualize correctly" - "not done yet right?" - "1840 flew over"

**What it means in practice**

- Behaviour checks ("12 rows, 12 bars") stay true while the layout is broken. Geometry has
  to be measured: overflow, overlap, clipping, ragged rows, tap targets.
- Check at more than one width. Most of these defects were invisible at the comfortable
  one.
- "It compiles" and "the test passes" are not evidence that a user can use it.

---

## 11. Ask what makes two things different

> "Horizontal ranked bar and Bullet whats different?"

The most useful single question asked during the build. It exposed that a control I had
added to the bullet chart quietly removed the marks that made it a bullet, leaving two
charts that looked alike and answered the same question badly.

**What it means in practice**

- If two components look similar, either they should be one component, or the difference
  should be visible in the first two seconds.
- A component keeps the features that define it, whatever else a control changes.
- The name and the title are a promise. If the title says "are we on track", something on
  screen must be the track.

---

## 12. Recompute from what is on screen now

A review pass over the finished page found twelve defects. Nine were the same one: a
value computed at load, or outside the draw, or from the source array rather than from
what the user is currently looking at.

> the readout naming a measure the picker had unticked - the legend listing series the
> filter had removed - the KPI tiles reporting a year while the chart beside them showed
> two months - a label built from the scale maximum instead of the row

This is principle 2 with a clock attached. Deriving the value is not enough; it has to be
derived **again, from the current state, every time the state changes**.

**What it means in practice**

- The draw takes the rows as an argument and reads nothing else. Anything reachable from
  outside is stale the moment a control is touched.
- Anything that describes the whole view is computed once per draw, above the empty
  guard, and never inside the loop over rows.
- The check is not "does it render" but **change one control and re-read every number on
  the screen**. The marks are almost never the thing that is wrong.

**The test:** for each number, label and legend entry, name the moment it was last
computed. If the answer is "at load", it is a bug waiting for the first click.

And the corollary, learned on the second review pass: **name the one place that holds the
truth, and render from there.** Where a rendering is done in the handler that changed the
state rather than in the draw that reads it, every other path to that state leaves the
screen behind. That is the same defect as computing at load, one step smaller.

---

## 13. Motion is how the interface narrates itself

Stated by the owner while reviewing a nav whose mark jumped between sections:

> "animation is for story telling and that's the core of the ux" - "to tell user with all
> the animation without telling them a word they will understand what's going on"

**What it means in practice**

- Every movement answers a question the reader would otherwise have to ask: *what just
  changed*, *where did it come from*, *where did it go*, *is there more past this*. A
  movement that answers none of those is decoration, and decoration is the thing that gets
  switched off first when the device is slow.
- The narration replaces words. A mark that travels says "you were there, now you are
  here" without a label. A five-pixel give at the end of a list says "there is nothing
  past this" without a disabled state or a message. A sheet that grows from the row that
  opened it says "this is that row" without a heading repeating the name.
- Which means the test is not "does it look smooth". It is: **cover the text and watch.
  Can someone say what happened?** If the movement is removed, is a sentence needed to
  replace it? If yes, it was carrying meaning and it earns its frames. If no sentence is
  needed, it was never saying anything.
- And the corollary the rest of the corpus keeps running into: because motion is
  narration, a *broken* animation is a lie rather than a blemish. A mark that lags one
  section behind says the reader is somewhere they are not. A transition that stalls says
  the interface is still working when it has stopped. Both are worse than no motion at
  all, which is why rules M1, N5 and Appendix W are as strict as they are.

**The test:** turn the sound off, so to speak - hide every label - and use the screen. What
the movement alone tells you should be true, and should be most of what you needed.

---

## How to use this file

Before adding a rule, check it against these. A new rule that contradicts one of them is
either a genuine exception worth stating, or a symptom that the principle needs rewriting.

Before calling UI work finished. The first eight are the principles asking their own
questions and are the short version; **9 onward are rule-level, and belong to the close-out
pass rather than to the thinking pass.** If only one pass is going to happen, it is 1-8, and
the checks in the project README (the reference page and the browser checks in the project this corpus came from (not carried in this package)) cover much of the rest mechanically:

1. Is this pattern applied everywhere it applies, or only here?
2. Is anything hand-picked that could be derived?
3. Does every element explain itself?
4. Does everything that looks interactive behave that way, and vice versa?
5. Is it dense without being cramped, at the width the user actually has?
6. Does it tell the truth when the truth is awkward?
7. Did I look at the rendered page, at two widths, before saying it was done?
8. After changing one control, is every other number on the screen still true?
9. Where the order means something, does the chart keep its own order and say so?
10. Does every early return leave the screen as true as the path that draws?
11. Do the documents describe what the code now does, including their own index?
12. Is any component doing less than its siblings, with a comment explaining why?
13. Is the second case an argument to the first, or a copy of it?
14. Can every label be read where it actually sits, over whatever it sits on?
15. Does every piece of content have a row type that fits it, or is one borrowing another's?
16. Is every label in a set oriented the same way, or does each one follow its own rule?
17. With an overlay open, can anything behind it scroll, focus, or be clicked?
18. On a phone, is the last row of the longest list fully reachable above the bottom bar?
19. Is this a phone interface, or a desktop one poured into a narrow container?
20. Does every navigation control actually navigate, and does the menu hold everything?
21. Is the user arranging the real thing, or a preview of it that has to be applied?
22. Is every required field marked before anything is typed, nudged when it is left empty, and is submit refusing with a count and the cursor in the first one?
23. Does the same message arriving twice keep its place on screen and count, rather than being removed and re-added?
24. Does every contrast, duration and measure in this screen have a figure behind it, or was it eyeballed?
25. Does anything that arrives late - an image, a face, a row - already have its space reserved before it lands?
26. Has a sixty-character name been typed into the longest row, or is the mock data still doing the testing?
27. At each decision on this screen, how many things is the user holding at once, and is it four or fewer?
28. After going forward and coming back, is the scroll, the sort, the filters and what was typed still there?
29. Blurred until the words stop being words, is the first thing still the first thing?
30. Is the spacing telling the reader what groups with what, or is it one value repeated?

---

## What has no principle behind it

Written down rather than papered over, because this file claims its principles come from
corrections made during a build, and inventing one to fill a gap would be the same defect
as inventing a rule.

The UI rules covering **internationalization** (83, 78), **performance and what arrives
late** (P1), **state restoration** (N4), **forms as a whole** (72, 80, 82) and
**cognitive load** (L9) arrived from outside this project's defects. They have no principle
above them here, and they will not until this project either breaks them or finds them
unnecessary. Until then they are held on the evidence of the sources they came from, which
is weaker than everything else in this corpus, and they are the first candidates to be cut
if they turn out not to earn their place.
