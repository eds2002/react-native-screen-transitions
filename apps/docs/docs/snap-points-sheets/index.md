---
title: Snap Points & Sheets
sidebar_position: 4
---

# Snap Points & Sheets

Once you add `snapPoints`, the screen becomes a sheet or drawer with intermediate resting states.

This is where the gesture system stops being a simple dismiss gesture and starts behaving like a small state machine.

## What changes when snapPoints exist

Snap points introduce two related behaviors:

- snap navigation between resting points
- dismissal from the minimum resting point when allowed

That means a snap sheet is not just a dismiss gesture anymore. It is a state machine with intermediate targets.

## Snap points claim both directions on their axis

This is a core rule.

A snap sheet automatically claims both directions on its axis:

- vertical sheet claims `vertical` and `vertical-inverted`
- horizontal drawer claims `horizontal` and `horizontal-inverted`

That is what lets a sheet both expand and collapse.

In other words:

- a bottom sheet can drag up to expand and drag down to collapse or dismiss
- a top sheet can drag down to expand and drag up to collapse or dismiss
- a right drawer can drag left to expand and drag right to collapse or dismiss
- a left drawer can drag right to expand and drag left to collapse or dismiss

## Sheet type reference

| Sheet type | `gestureDirection` | Claims | Expand gesture | Collapse / dismiss gesture | Scroll boundary |
| --- | --- | --- | --- | --- | --- |
| Bottom sheet | `vertical` | `vertical` + `vertical-inverted` | up | down | top |
| Top sheet | `vertical-inverted` | `vertical` + `vertical-inverted` | down | up | bottom |
| Right drawer | `horizontal` | `horizontal` + `horizontal-inverted` | left | right | left |
| Left drawer | `horizontal-inverted` | `horizontal` + `horizontal-inverted` | right | left | right |

## Main sheet options

The core options are:

- `snapPoints`
- `initialSnapIndex`
- `snapVelocityImpact`
- `gestureEnabled`
- `sheetScrollGestureBehavior`

`gestureEnabled` only controls whether the sheet can dismiss from its minimum snap. It does not disable snapping between non-dismiss detents.

That distinction matters:

- moving between detents is still allowed while the sheet is open
- only the final close to `0` is gated by `gestureEnabled`

## Auto snap

`"auto"` is now part of the model.

```tsx
options={{
  snapPoints: ["auto", 1],
  initialSnapIndex: 0,
}}
```

That lets the screen measure its content and use its intrinsic height as a detent.

## Expand vs collapse

Collapse and expand do not behave identically.

Collapse:

- always respects the relevant scroll boundary
- can dismiss from the minimum snap when dismissal is enabled

Expand:

- depends on `sheetScrollGestureBehavior`
- can be more permissive or more conservative depending on the chosen mode

## Touch zones inside a sheet

There are really two interaction zones:

- deadspace such as headers, handles, or non-scroll regions
- nested scroll content

Deadspace can drive the sheet directly.

Nested scroll content has to respect boundary rules first. That is where `Transition.ScrollView` and `Transition.FlatList` matter, because they know how to coordinate with the sheet gesture instead of stealing touches forever.

## Sheet boundary depends on origin

Each sheet type has one important scroll boundary based on where it comes from:

- bottom sheet: top boundary of the nested vertical scroll view
- top sheet: bottom boundary of the nested vertical scroll view
- right drawer: left boundary of the nested horizontal scroll view
- left drawer: right boundary of the nested horizontal scroll view

That is the rule behind both collapse and scroll-driven expansion.

## sheetScrollGestureBehavior

This option controls how nested scroll content participates in expansion.

### "expand-and-collapse"

This is the broader Apple Maps-style feel:

- expansion can happen through nested scroll content at the relevant boundary
- collapse can also happen through nested scroll content at the relevant boundary

### "collapse-only"

This is the tighter Instagram-style feel:

- collapse still works through nested scroll content at the boundary
- expansion through scroll content is blocked
- expansion is expected to happen through deadspace instead

`expandViaScrollView` still exists as a deprecated alias, but `sheetScrollGestureBehavior` is the canonical API now.

## What scroll content can do in each mode

| Mode | Collapse through scroll content | Expand through scroll content |
| --- | --- | --- |
| `"expand-and-collapse"` | yes, at the relevant boundary | yes, at the relevant boundary |
| `"collapse-only"` | yes, at the relevant boundary | no, use deadspace instead |

This is the real Apple Maps vs Instagram split:

- Apple Maps style lets scroll content expand once the correct boundary is reached
- Instagram style keeps expand on deadspace and leaves scroll content to collapse only

## Programmatic snap

Use `snapTo()` when the UI should drive the sheet imperatively.

That is useful for:

- jumping to a detent from a button press
- syncing a sheet to app state
- responding to navigation or workflow state

`snapTo(index)` targets the sorted snap-point index for the currently focused sheet screen. The screen still uses the same animation system. Only the trigger changes.

## A few practical rules

- if a sheet contains scroll content, prefer `Transition.ScrollView` or `Transition.FlatList`
- if you want Apple Maps behavior, use `sheetScrollGestureBehavior: "expand-and-collapse"`
- if you want Instagram behavior, use `sheetScrollGestureBehavior: "collapse-only"`
- if you want intrinsic sheet height, include `"auto"` in `snapPoints`

## Source routes to study

- `bottom-sheet/auto-snap`
- `bottom-sheet/multi-snap`
- `bottom-sheet/with-scroll`
- `bottom-sheet/with-scroll-inverted`
- `bottom-sheet/with-scroll-horizontal`
- `gestures/scroll-apple-maps`
- `gestures/scroll-instagram`
- `gestures/snap-deep-nesting`
- `gestures/snap-different-axis`
- `gestures/snap-locked-no-bubble`
