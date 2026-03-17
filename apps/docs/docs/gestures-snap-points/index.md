---
title: Gestures & Snap Points
sidebar_position: 1
---

# Gestures & Snap Points

The gesture system is designed around two jobs:

- deciding who owns the gesture
- deciding where the screen should settle

## Core gesture controls

The main per-screen controls are:

- `gestureEnabled`
- `gestureDirection`
- `gestureActivationArea`
- `gestureResponseDistance`
- `gestureVelocityImpact`
- `gestureReleaseVelocityScale`
- `gestureReleaseVelocityMax`

Use the first group to decide **when a gesture can start**. Use the velocity settings to tune **how decisive the release feels** once the user lets go.

## Snap points turn a screen into a sheet

Once you add `snapPoints`, the screen gets intermediate resting states:

```tsx
options={{
  snapPoints: ["auto", 1],
  initialSnapIndex: 0,
  backdropBehavior: "collapse",
}}
```

Important sheet controls:

- `snapPoints`
- `initialSnapIndex`
- `snapVelocityImpact`
- `gestureSnapLocked`
- `sheetScrollGestureBehavior`
- `backdropBehavior`
- `backdropComponent`
- `surfaceComponent`

## Auto snap is now part of the model

3.4 adds intrinsic snap points through `"auto"`:

```tsx
options={{
  snapPoints: ["auto", 1],
  initialSnapIndex: 0,
}}
```

That means the sheet can start at its measured content height instead of forcing you to hard-code a detent.

## Scroll handoff policy

The sheet/scroll relationship is controlled by `sheetScrollGestureBehavior`:

- `"expand-and-collapse"`: scroll boundaries can expand upward and collapse downward
- `"collapse-only"`: upward expansion is more conservative, but collapse still works at the boundary

This is the difference between a broad Apple Maps-style feel and a tighter Instagram-style feel.

`expandViaScrollView` still exists as a deprecated boolean alias, but `sheetScrollGestureBehavior` is the clearer 3.4 API.

## Programmatic control

Use `snapTo()` when the UI needs to drive the sheet instead of waiting for user input.

That keeps transition logic in one place: the screen still participates in the same animation system, but the trigger is now imperative.

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
