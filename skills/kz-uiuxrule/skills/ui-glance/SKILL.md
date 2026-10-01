---
name: ui-glance
description: Review a UI screenshot in one pass against a twenty-two-point visual checklist, citing rule ids from kz-uiuxrule. Use when someone pastes or points at a screenshot and wants to know quickly what is wrong with it, or asks for a fast look, a sanity check, or a first impression of a screen. Costs one read - it does not open the rule set. Not for reviewing code, and not for anything a picture cannot show: contrast figures, keyboard paths, states and behaviour need the real thing.
version: 1.1.0
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# Glance - a screenshot, one pass

The fast path of `kz-uiuxrule`. The parent skill asks what it is for before it
does anything; this one does not, because the request already says: *look at this and tell
me what is wrong*. Answer, do not ask.

**Read only this file.** Do not open the parent rule set - the ids below are enough to
cite, and the whole point of this mode is that it costs one read. If the user then asks
what a rule actually says, *that* is when you open `../../rules/ui-rules.md` and quote it.

Work top to bottom. The order is how often each one is the actual problem, so the first
five catch most screenshots. Report only what you can *see* - every finding names its rule
id and what in the image shows it. Four findings that are visible beat twelve that are
inferred.

---

## The pass

| # | Look for | If wrong | Rule |
|---|---|---|---|
| 1 | **Two left edges in one box** - text or a control not lining up with the block above it | one inset for the box, set once | `L2` |
| 2 | **Everything equally loud** - blur the image in your mind: is anything obviously first? | size, weight and space, not colour | `L1` |
| 3 | **One spacing value everywhere** - groups not separated more than their own rows | tight inside a group, generous between | `L3` |
| 4 | **A table with no search or no sort marks - or a filter row that is an empty typed box under every column** (a box is not a filter), or a line between the titles and that row | the table pattern: a button per column that opens a panel; title and filter rows one block, one line under the filters | `S1`, `T1` |
| 5 | **A delete, clear or reset sitting bare** - no confirm implied, no undo | confirm that names the target | `S2` |
| 6 | **A column of numbers with a ragged right edge** | tabular figures, right-aligned | `Y1` |
| 7 | **Buttons that are text-only in a toolbar, or an icon with no label anywhere** | icon leads, label when it fits, always explainable | `B1`, `B2` |
| 8 | **A mystery icon** - a glyph you cannot name at a glance, or an emoji used as one | a real icon from one set, with a name | `B2`, `D6` |
| 9 | **The current item in a nav not marked, or marked in the wrong place** | the mark belongs to the item it marks | `N5` |
| 10 | **Grey text doing content work** - a label, value or status in the muted colour | content is foreground; grey is chrome | `Y2` |
| 11 | **Truncated text with no way to see the rest** - an ellipsis and nothing else | keep the full text reachable | `P2` |
| 12 | **A one-line box holding something written in lines** - a message, a note, an address, a template | the field is the shape of its content, and grows | `F4` |
| 13 | **Column headers that are abbreviations** - `Chg`, `Prog`, `Share` with no explainer | one line per column, on the header | `T3` |
| 14 | **A control row at three different heights** | one control-height token per row | `L5` |
| 15 | **An empty area where a state should be** - blank where "no results" or "nothing yet" belongs | every applicable state ships | `A4` |
| 16 | **A number with no unit** - a bare figure, an axis with no label | say the unit and the range | `C8` |
| 17 | **A chart with no table beside it** (unless it is a glyph inside a bigger component) | the table is the accessible, checkable version | `C10` |
| 18 | **Colour as the only difference** - a legend, a status, a direction distinguished by hue alone | a second channel: shape, label, position | `C7` |
| 19 | **Tap targets that look under a fingertip** on a phone screenshot | 44px minimum, spacing between | `L5`, `X1` |
| 20 | **A shadow with no offset** - a glow rather than a lift | offset and blur, one light source | `L4` |
| 21 | **Two mechanisms for one job** - a toolbar dropdown beside a column filter for the same field | one mechanism | `T4` |
| 22 | **A rectangle round a curved mark** - a box drawn round a wedge, bubble or segment to show it is selected or focused | the ring follows the mark's own outline | `C5` |

---

## What a screenshot cannot tell you

Say so rather than guessing, and offer the check that would settle it:

- **Contrast** - a picture suggests, it does not measure. `Y2` is a figure (4.5:1 body,
  3:1 large and non-text). If it looks close, say "looks close, measure it".
- **Keyboard and focus** - tab order, focus rings, escape from overlays. Invisible here.
- **States** - loading, error, empty, permission. A screenshot is one state of several.
- **Behaviour** - whether the filter applies live, whether clear clears everything,
  whether coming back restores the view. `A3`, `N4`, `T1` need the real thing.
- **Motion** - whether the mark travels or teleports, whether reduced motion is honoured.
- **Hover and press** - whether a clickable thing answers the pointer, and with the same cue
  as the others (`B4`). A still has no pointer in it.
- **A gap of a pixel or two** - a filter box touching its header line is invisible in a
  scaled-down screenshot. Measure it: `kz-uicheck` `table-check.js`, `FILTERGAP`.

## Reporting

```
GLANCE - <what the screenshot is>
  1. <rule id> - <what is visible> -> <the one-line fix>
  2. ...
Cannot tell from an image: <the two or three worth measuring, with the check>
```

Three to six findings. If nothing in the list is visibly wrong, say that plainly and name
the two or three things that would need measuring to be sure - a clean glance is a useful
answer, and inventing a finding to look thorough is the failure this mode is most prone to.
