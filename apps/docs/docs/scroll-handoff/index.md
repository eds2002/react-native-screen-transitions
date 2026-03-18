---
title: Scroll Handoff
sidebar_position: 3
---

# Scroll Handoff

Scroll handoff answers a different question from ownership:

If a touch starts inside scroll content, should the scroll view keep it, or should the dismiss pan take over?

Ownership answers who is allowed to handle a direction. Handoff answers when a scrollable is ready to yield to that owner.

## The golden rule

A ScrollView must be at its boundary before it yields control to the gesture owner.

That rule is the backbone of both regular dismissible screens and snap sheets.

## Axis isolation

Scroll handoff is axis-aware:

- a vertical scroll view never blocks horizontal gestures
- a horizontal scroll view never blocks vertical gestures

This is what keeps two-axis layouts usable instead of sticky.

The current branch also resolves both directions on the same axis independently. A single vertical `Transition.ScrollView` may coordinate with one owner for `vertical` and a different owner for `vertical-inverted`.

## Non-sheet boundary behavior

For screens without `snapPoints`, the rule is direction-specific:

| Direction | Scrollable axis | Yield boundary |
| --- | --- | --- |
| `vertical` | vertical | top |
| `vertical-inverted` | vertical | bottom |
| `horizontal` | horizontal | left |
| `horizontal-inverted` | horizontal | right |

If the scroll view can still move in that direction, it keeps control.

In practical terms:

- a vertical scroll view yields `vertical` only when it cannot scroll upward anymore
- a vertical scroll view yields `vertical-inverted` only when it cannot scroll downward anymore
- a horizontal scroll view yields `horizontal` only when it cannot scroll left anymore
- a horizontal scroll view yields `horizontal-inverted` only when it cannot scroll right anymore

This is not a generic bubbling system. The scrollable stays in charge until the correct boundary for that exact direction is reached.

## Why Transition.ScrollView and Transition.FlatList matter

`Transition.ScrollView` and `Transition.FlatList` are connected to the gesture ownership system instead of competing blindly with it.

That gives them two jobs:

- report scroll state and boundaries to the gesture layer
- coordinate with the relevant pan gestures through the native gesture system

On the current branch, they can coordinate with both owners on the same axis. That is what makes cases like "child owns swipe up, ancestor owns swipe down" work with one vertical scrollable.

That is why transition-aware scrollables are the right default when scrolling and dismissal must cooperate. A plain React Native `ScrollView` cannot participate in these ownership-aware decisions.

## What the runtime checks

When a touch is on scroll content:

1. ownership is resolved for the drag direction
2. the runtime checks whether the touch is on a registered transition-aware scrollable
3. the relevant boundary for that direction is checked
4. only once that boundary is reached can the owner pan activate

If the boundary is not reached yet, the scrollable keeps control.

That is the whole handoff:

- if content can still scroll in the dragged direction, it keeps the touch
- if content has reached the matching boundary, the gesture owner gets a chance to activate

## Why this matters in nested stacks

Nested gesture trees often have one screen claiming a direction while another screen contains scroll content.

Handoff is what makes those flows feel correct:

- scrolling works normally while content still has room
- once the boundary is reached, the gesture owner can take over
- ownership and handoff stay separate instead of leaking into each other

That separation is the important part:

- ownership tells you who may handle the drag
- handoff tells you when a scrollable is ready to yield

## Common patterns

### Scroll content inside a dismissible screen

- screen claims `vertical`
- inner `Transition.ScrollView` scrolls normally
- once it reaches top, dragging down can dismiss

### One vertical scrollable, two vertical owners

- child screen owns `vertical-inverted`
- ancestor owns `vertical`
- the same vertical scrollable yields upward at bottom and downward at top

### Horizontal drawer with vertical content

- vertical content never blocks horizontal ownership
- the drawer gesture can still activate on its axis

## Source routes to study

- `gestures/scroll-boundary`
- `gestures/scroll-direction-propagation`
- `gestures/claim-fallback`
- `gestures/two-axes`

For sheet-specific scroll rules, open [Snap Points & Sheets](/docs/snap-points-sheets).
