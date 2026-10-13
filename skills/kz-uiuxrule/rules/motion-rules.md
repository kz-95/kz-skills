# Motion Rules

Rules for anything that moves: a transition, an animation, a press, a panel opening, a
gesture. `M1-M6`, and the numbers they point at.

This file is complete on its own, so motion work can read it without the rest of the
corpus. It still sits **on top of** [engineering-rules.md](../../kz-engrules/rules/engineering-rules.md)
and [ui-rules.md](ui-rules.md), never instead of them. Where motion touches another rule,
that rule is cited by ID: the hover and focus halo is `B4`, the travelling "you are here"
mark is `N5` and its Appendix W, the tooltip delay is Appendix D, the theme is `Y3`.

The same order of precedence as every rule file applies: the task's explicit instruction,
then the project's own rules, then consistent existing code, then this file. **A style or
design skill decides the personality of the motion** - how bouncy, how crisp - and nothing
these rules state. Departing from a rule is fine; departing silently is not.

The live samples are in `ui-rules-visual.html`, section M. The check is
[`motion-check.js`](../../kz-uicheck/checks/motion-check.js) in `kz-uicheck`, which reads
`M1`, `M3`, `M4` and `M5` on any page. `M2` and `M6` are behaviour, so the reference page's
`rules-check.js` asserts them on their samples, and the check line in each rule says how to
test them by hand.

---

## The rules

| # | Rule |
|---|---|
| M1 | **Motion is functional or absent.** Transitions explain a state change (enter, exit, reorder); respect `prefers-reduced-motion`, and respecting it means an alternative that still shows the state change, never a blanket `0.01ms` that deletes the feedback with the animation. Decorative animation is skipped. **Duration comes from the distance, and the bands are below.** Exit faster than entrance, decelerate on arrival, and move or fade rather than animating a property that forces the layout to be recomputed. Check: `motion-check.js` `LAYOUTPROP`, and `NOREDUCE` as an advisory. |
| M2 | **How often it is seen decides whether it moves.** Something opened from the keyboard, or used many times an hour - a command palette, a shortcut, list navigation, a tab switched by key - appears in its final state with no transition. Occasional things (a modal, a drawer, a toast) take the standard band; only rare moments (a first run, a finished upload) get anything more. The failure: an animation on a hundred-times-a-day action is felt as latency, and it is still running when the next keystroke lands. Check: open it from the keyboard, then on the next frame `el.getAnimations({ subtree: true })` is empty. |
| M3 | **Nothing enters from nothing, and a panel grows from what opened it.** An entrance starts at a scale of 0.9 to 0.97 with opacity 0, never `scale(0)`: a thing that swells out of a point reads as a glitch, not an arrival. An anchored panel - a popover, a menu, a dropdown, a tooltip - sets its `transform-origin` on the side that faces its trigger, so it visibly comes from the control that was pressed. A modal is anchored to nothing and stays centred. Check: `motion-check.js` `SCALE0` and `ORIGIN`. |
| M4 | **A transition names what it moves, and it starts fast.** Never `transition: all`: it animates whatever changes next, including layout and every colour a theme switch flips. Never `ease-in` on interface motion: it delays the first movement, which is the frame the user is watching, so a 200ms ease-in feels slower than a 200ms ease-out. Use the named curves below. Check: `motion-check.js` `ALL` and `EASEIN`. |
| M5 | **A press answers before the action does.** Every button shows a pressed state for as long as it is held - a scale of 0.95 to 0.98, or the `B4` halo deepening - with no delay and no longer than the press band. Without it, an action that takes a moment is indistinguishable from a click that missed, and the user clicks again. `B4` is the answer to the pointer arriving; this is the answer to the press. Check: `motion-check.js` `NOPRESS`. |
| M6 | **Once one tooltip is open, the next one opens at once.** The first tooltip waits (Appendix D: about 400ms) so a pointer passing over does not set it off. While one is open, and for about 300ms after it closes, a neighbour opens with no delay and no transition. Without this, reading a toolbar costs the full delay on every button, and the delay that protected the first hover punishes every hover after it. Check: hover one control until its tooltip shows, move to the next, and its tooltip is on screen inside 100ms. |

**Order of the rules:** M1 is the floor and was written first. M2 decides whether
something moves at all, M3 and M4 how it moves, M5 and M6 how fast the interface answers.

---

## Appendix: the numbers (rules M1-M6)

A rule that says "short" or "smooth" is a judgement the next person makes differently.
These are the figures behind them.

### Durations

| Duration | For |
|---|---|
| 100-150ms | Acknowledging a press. Longer reads as latency, not as animation |
| 150-300ms | A routine state change: a toggle, an expand, a filter applying |
| 300-500ms | An overlay, a sheet, a view transition - a thing that moves a long way |
| 500ms+ | One authored moment on a page that has earned it, and nothing else |

Where something travels a distance rather than simply appearing, the shape inside the
duration is **2 : 1 : 2** - accelerate, hold, decelerate - so at 500ms that is 0.2s in,
0.1s across, 0.2s out. See [ui-rules.md](ui-rules.md) Appendix W, which is where the
travelling mark uses it.

Exit runs at roughly two thirds of entry: an exit as long as its entry feels like the
interface is reluctant to let go. Arrivals decelerate - a strong ease-out, not a linear
ramp; bounce and elastic are a decision, never a reflex. Move and fade before reaching for
anything else, because those are the two things every platform can animate without
recomputing layout, and where blur, shadow or a mask genuinely say something, bound the
region they run on.

### Curves

The keyword curves are weak: `ease-out` barely decelerates. Name the curve once, as a
token, and use the token.

| Token | Curve | For |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Anything arriving or leaving: a panel, a toast, a press |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Something already on screen moving to a new place |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | A sheet or drawer that follows a finger |
| `linear` | - | Constant motion only: a progress bar, a marquee, a hold-to-confirm fill |

The names are a convention, not a requirement: a project with its own motion tokens keeps
them (D2). What is required is that the curve decelerates on arrival (M4).

### Two mechanics that decide whether motion feels built or bolted on

- **Interruptible.** A second click during an animation takes effect now. An animation
  that must finish before the UI listens again is a queue the user cannot see. A CSS
  transition retargets from where it is; a keyframe animation restarts from its first
  frame. Anything that can be triggered again quickly - a toast, a toggle, a stack - uses
  a transition.
- **Visible by default.** The resting state of an element that animates in is *visible*.
  If the entrance is what makes it appear, a failed script, a blocked observer or reduced
  motion leaves a blank page - and the blank page looks like a bug in the data, which is
  where the next hour goes.

### Reduced motion

`prefers-reduced-motion` means a different transition, not no transition. A state change
still has to be legible when it is honoured; a global `* { animation-duration: 0.01ms }`
satisfies the setting and deletes the feedback that told the user their click landed.
Keep the fade and the colour change; drop the travel, the scale and the parallax.

### Press and release are not the same speed

Slow where the user is deciding, fast where the interface is answering. A
hold-to-confirm fill runs linear over its full time (about 2s) while held; letting go
snaps it back in the press band with an ease-out. The same asymmetry is why exit is
shorter than entry.

### Several things arriving together

A group that enters at once may stagger, **30-80ms between items**, and the whole group is
inside the band for its size. Stagger is decoration: nothing waits for it - every item is
clickable the moment it exists - and under reduced motion the group arrives together.

### A crossfade that looks like two things

Where two states crossfade and the eye sees both at once, a blur of **2px or less** during
the change merges them into one. Above that it reads as a fault, and a large blurred area
is expensive to paint: bound it.

### Drag and gesture

Not rules, because they have no check that runs on any page, but each is a defect when
missed:

- **Dismiss on speed as well as distance.** A flick that travels a short way fast is a
  dismissal; requiring the full threshold makes the gesture feel ignored.
- **Resist past a boundary, do not stop dead.** Dragging beyond the end moves the element
  less and less (damping) instead of hitting an invisible wall.
- **Capture the pointer once a drag starts**, so the drag continues when the pointer
  leaves the element.
- **One pointer drives a drag.** A second touch after the drag began is ignored, or the
  element jumps to the new finger.

### Performance

- **Move the element itself.** Changing a CSS custom property on a container restyles
  every descendant each frame; set `transform` on the element that moves.
- **Predetermined motion in CSS, or the Web Animations API.** Both run off the main
  thread. A script that animates frame by frame drops frames whenever the page is busy
  loading - which is exactly when a transition is on screen.
- **Never transition a layout property** - see [ui-rules.md](ui-rules.md) Appendix Z,
  lesson 17, for what a stalled layout transition looks like and how to diagnose it
  (`el.getAnimations()`).

### Reviewing motion

Judge it slowed down. Set the duration to 2-5 times its value, or use the browser's
animation inspector, and look for: two states visible at once in a crossfade, an element
scaling from the wrong point, properties that should move together arriving at different
times, a start or stop that jerks. Then judge it again the next day, at full speed.

Measure end states with transitions switched off: a value read mid-flight was never on
screen ([ui-rules.md](ui-rules.md) Appendix Z, lesson 18).
