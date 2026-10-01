# Using kz-skills with impeccable

[impeccable](https://impeccable.style) is a design skill: it decides how an interface should **look and feel**. `kz-uiuxrule` decides what an interface must **do**, and checks that it does. They are built to be used together: use impeccable when you are deciding a style, and `kz-uiuxrule` to keep behaviour correct whatever the style is.

> Written against impeccable 4.0.2. If a later version changes a line quoted here, trust the later version.

## Precedence

1. **Your explicit instruction** in the current task.
2. **The project's own rules**, wherever they live.
3. **`kz-uiuxrule`**: these rules.
4. **impeccable**, or any style skill: it decides what 1 to 3 leave open.

**Where they conflict, `kz-uiuxrule` wins.** impeccable is not outranked on taste, because `kz-uiuxrule`
has no opinion on taste. It is outranked on anything the rules state, and on anything they check.

## Who decides what

| Question | Decided by | Why |
|---|---|---|
| Palette, typeface, shape language, density, motion personality | **impeccable**, or your brief | `kz-uiuxrule` is style-neutral by design: it never picks a look |
| Does a table filter work, does typing survive a re-render, is a selection ring visible | **kz-uiuxrule** | Behaviour, with a check that fails when it breaks |
| Is the text readable, the target tappable, the gap measurable | **Both agree**, and the rules' figures stand | Same floors; see below |
| What the project already decided | **The project** | Both skills defer to it: impeccable says "the brief wins"; `kz-uiuxrule`'s precedence ladder puts the project's own rules above its own |

## Where they agree

Different words, same line. When both are loaded, neither contradicts the other here.

| Topic | impeccable | kz-uiuxrule |
|---|---|---|
| Contrast | body and placeholder at least 4.5:1, large text 3:1 | `Y2`: the same figures |
| Depth | "shadows carry an offset and a soft blur" | `L4`: depth comes from light, or it is decoration |
| Input size on a phone | 16px, because iOS zooms smaller focused inputs | `Y1` and `F8`: a 16px floor on every field |
| States | hover, focus, active, disabled, loading, error, empty | `A4`: every applicable state ships |
| Animating layout | avoid `width`, `height`, `top`, `left`, margins | `M1`: never transition a layout property |
| Keyboard focus | preserve visible focus | `B4`, `C5`: a visible, shape-following ring |

## Where they can pull against each other

Three real tensions. None is a contradiction, but an agent that reads both literally can trip on them.

**1. The halo.** impeccable's craft floor says "a zero-offset colored halo is decoration". `B4` asks for a halo on hover and focus. They are about different jobs: that line is about **depth at rest**, a glow standing in for a shadow; `B4` is a **state cue** that appears only when the pointer or focus is on something clickable. impeccable also requires visible hover and focus states. **`B4` wins: at rest, no halo; on state, a halo that is at least 3:1 against its surface.**

**2. Verification depth.** impeccable verifies "in bounded passes, not a loop". `kz-uiuxrule` mode 4 (Loop) runs three reviewers against a separate fixer until they agree with evidence. When you choose Loop, **the loop wins** for behaviour. Bounded passes remain right for taste and craft, which the rules do not judge. The loop only runs when you ask for it.

**3. Two questions at the start.** `kz-uiuxrule` asks what a task is for, once, as a card with a recommended answer. impeccable has its own interview steps. If both ask, fold the style questions into the one card: the card always has a custom option. `kz-askcard` rule 6: one card per turn.

## A sequence that works

1. **Decide the look** with impeccable: `shape` or `craft` for a new surface, or your brief. Record the result (palette, type, shape language) as the project's own rules.
2. **Build** with `kz-uiuxrule` in Build mode. The decided style is "the project's own rules", and wins over anything in the rule set that could touch it. The rules constrain behaviour and floors, not looks.
3. **Close out** with `kz-uicheck` (layout, tables, typing, in both themes and at 375px) and impeccable's audit or polish for craft.
4. **When they disagree, `kz-uiuxrule` wins**: a filter, a field, a focus ring, a selection, a contrast figure, a target size. impeccable then decides what is left, which is the look: type, colour, shape, rhythm. That is not a concession: the rules say nothing about those, so there is nothing to override.

## What each leaves alone

impeccable refuses defaults such as same-size icon cards, gradient text, decorative glass, a coloured side border on cards, and an eyebrow over every section. `kz-uiuxrule` has no rule for or against any of them: they are looks, so they are impeccable's.
