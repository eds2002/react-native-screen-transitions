---
title: Gestures
sidebar_position: 1
---

# Gestures

The gesture system is not one feature.

It is several connected systems:

- ownership
- scroll handoff
- snap sheets and drawers
- release targeting and programmatic snap

That is why this section is split up:

- [Gesture Ownership](/docs/gesture-ownership)
- [Scroll Handoff](/docs/scroll-handoff)
- [Snap Points & Sheets](/docs/snap-points-sheets)

## Core controls

The main per-screen controls are:

- `gestureEnabled`
- `gestureDirection`
- `gestureActivationArea`
- `gestureResponseDistance`
- `gestureVelocityImpact`
- `gestureReleaseVelocityScale`
- `gestureReleaseVelocityMax`
- `snapPoints`
- `initialSnapIndex`
- `snapVelocityImpact`
- `sheetScrollGestureBehavior`
- `gestureSnapLocked`

The first group decides when a gesture can start. The velocity settings decide how decisive the release feels. `snapPoints` and `sheetScrollGestureBehavior` move the screen into sheet behavior instead of plain dismissal behavior.

## Mental model

Keep these rules in your head:

- gestures dismiss stacks, not isolated components
- ownership is per direction
- child claims shadow ancestors for that same direction
- ScrollViews must reach their boundary before they yield
- snap sheets claim both directions on their axis

## Nested gesture coordination

The current branch also lets you target ancestor screens when you read gesture or animation state:

```tsx
const parentGesture = useScreenGesture("parent");
const rootAnimation = useScreenAnimation("root");
```

Or target a specific depth:

```tsx
const grandparentAnimation = useScreenAnimation({ ancestor: 2 });
```

That is useful when a nested sheet, drawer, or custom pan gesture needs to coordinate with something higher in the tree.

## Example coverage in the repo

The demo app covers:

- `bottom-sheet/multi-snap`
- `bottom-sheet/auto-snap`
- `bottom-sheet/backdrop-dismiss`
- `bottom-sheet/snap-lock-*`
- `bottom-sheet/with-scroll*`
- `gestures/scroll-apple-maps`
- `gestures/scroll-instagram`
- `gestures/snap-*`
- `gestures/deep-nesting`
- `gestures/claim-fallback`

Those routes are the fastest way to understand how scroll boundaries and snap behavior interact in practice.
