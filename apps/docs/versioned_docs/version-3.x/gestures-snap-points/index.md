---
title: Gestures and Snap Points
sidebar_position: 1
---

# Gestures and Snap Points

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
- `gestureDrivesProgress`

Use the first group to decide **when a gesture can start**. Use the velocity and progress settings to tune **how direct the gesture feels** once it is active.

## Snap points turn a screen into a sheet

Once you add `snapPoints`, the screen gets intermediate resting states:

```tsx
options={{
  snapPoints: [0.5, 1],
  initialSnapIndex: 0,
  backdropBehavior: "collapse",
}}
```

Important sheet controls:

- `snapPoints`
- `initialSnapIndex`
- `snapVelocityImpact`
- `gestureSnapLocked`
- `expandViaScrollView`
- `backdropBehavior`
- `backdropComponent`

## Scroll handoff policy

The sheet/scroll relationship is controlled by `expandViaScrollView`:

- `true`: scrolling at the boundary can expand upward and collapse downward
- `false`: expansion only works from deadspace, but collapse still works at the boundary

This is the difference between a broad Apple Maps-style feel and a tighter Instagram-style feel.

## Programmatic control

Use `snapTo()` when the UI needs to drive the sheet instead of waiting for user input.

That keeps transition logic in one place: the screen still participates in the same animation system, but the trigger is now imperative.

## Example coverage in the repo

The demo app covers:

- `bottom-sheet/multi-snap`
- `bottom-sheet/backdrop-dismiss`
- `bottom-sheet/snap-lock-*`
- `bottom-sheet/with-scroll*`
- `gestures/scroll-apple-maps`
- `gestures/scroll-instagram`

Those routes are the fastest way to understand how scroll boundaries and snap behavior interact in practice.
