---
name: kz-motionrule
description: The motion part of the kz UI rules on its own - six rules (M1-M6) for transitions, animation, press feedback, popovers and tooltips, with the duration bands, named easing curves, reduced motion, stagger, gestures and performance behind them, and motion-check.js to measure them on any page (transition all, ease-in, layout transitions, scale(0), centre-origin popovers, buttons with no press state). Use when the work is only about how something moves - adding or reviewing an animation, a transition, an easing curve, a hover or press effect, a drawer or toast entrance - and the rest of kz-uiuxrule is not needed. Triggers on "/kz-motionrule", "motion rules", "animation rules", "review this animation", "easing", "transition".
license: Apache-2.0 with Commons Clause (see LICENSE in the repository)
---

# kz-motionrule

The motion rules without the rest of the corpus. The rules themselves live in one place,
[`motion-rules.md`](../kz-uiuxrule/rules/motion-rules.md), which `kz-uiuxrule` also routes
to for its M category - this skill is a lane into that file, not a copy of it.

## When to use this rather than kz-uiuxrule

| The work | Use |
|---|---|
| Only motion: an animation, a transition, a press or hover effect, an entrance, an easing curve | **This skill** |
| A component or screen that also moves (a modal, a drawer, a table with a toast) | `../kz-uiuxrule/` - its INDEX routes the motion part here as well |
| A screenshot to glance at | `../kz-uiuxrule/` mode 0 - a still picture shows no motion |

## What to do

1. **Ask first only if the request is unclear** - review or build, and which elements. One
   card, in the `../kz-askcard/` format. A request that names both goes straight on.
2. **Read [`motion-rules.md`](../kz-uiuxrule/rules/motion-rules.md)** - the six rules and
   the appendix of numbers. It is short and complete on its own.
3. **Before writing any animation**, answer in order: does it move at all (M2), what is it
   for (M1), which curve (M4 and the curve table), how long (the duration bands), and
   where does it grow from (M3).
4. **Measure, then report.** Paste
   [`motion-check.js`](../kz-uicheck/checks/motion-check.js) into the console of the page,
   or run `python ../kz-uicheck/scripts/run-checks.py page.html --checks motion-check`. M2
   and M6 are behaviour: test them by hand as each rule's check line says.
5. **Report by rule ID**, one row per finding, with the measurement behind it:

| Rule | Found | Change to | Why |
|---|---|---|---|
| M4 | `transition: all 300ms` on `.card` | `transition: transform 200ms var(--ease-out)` | `all` also animates the theme's colour flip |
| M3 | menu scales from `50% 50%` | `transform-origin: top left` | it should grow from the button that opened it |

A finding with no measurement is an opinion. A documented departure is not a finding.

## Always in force

`kz-engrules` applies to every task, and the safety floor holds: reduced motion is an
accessibility basic, so a project convention that ignores it is a bug in the convention.
