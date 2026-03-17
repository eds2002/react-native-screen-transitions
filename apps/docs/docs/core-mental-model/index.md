---
title: Core Mental Model
sidebar_position: 1
---

# Core Mental Model

The package becomes predictable once you anchor on two ideas:

1. every screen exposes transition state
2. your interpolator returns styles for named visual slots

## Progress is the backbone

The combined `progress` value moves through a simple range:

```text
0 -------- 1 -------- 2
entering   visible    exiting
```

Typical navigation behavior:

- pushed screen: `0 -> 1`
- previous screen during push: `1 -> 2`
- dismissed screen: runs the reverse path under the hood

That `progress` value is passed into `screenStyleInterpolator` together with:

- `current`, `previous`, `next`
- `stackProgress`
- `snapIndex`
- `layouts.screen` and `layouts.content`
- `bounds()`
- safe-area `insets`

## Return slots, not one giant style blob

The interpolator returns a map of named transition slots:

```tsx
return {
  content: {
    style: { opacity: 1 },
  },
  backdrop: {
    style: { opacity: 0.45 },
    props: { intensity: 80 },
  },
  surface: {
    style: { transform: [{ scale: 0.98 }] },
  },
  "hero-image": {
    style: { borderRadius: 24 },
  },
};
```

The important slots are:

- `content`: the main screen content layer
- `backdrop`: the layer between screens
- `surface`: the animated surface layer inside the screen
- custom ids like `"hero-image"`: styles attached to `Transition.View` or other transition-aware components through `styleId`

## The default export is your transition toolkit

The root export gives you the high-level pieces:

- `Transition.Presets`
- `Transition.Specs`
- `Transition.Boundary`
- `Transition.View`, `Transition.Pressable`, `Transition.ScrollView`, `Transition.FlatList`
- `createTransitionAwareComponent`

That means you do not need to wire separate wrappers for every animated target. The package already exposes transition-aware primitives for common cases.

## Shared bounds are layout-driven, not magic

For cross-screen choreography, the main inputs are:

- `sharedBoundTag` to pair matching elements
- `styleId` to target a specific element from the interpolator
- `Transition.Boundary` to group or isolate measurements
- `bounds()` helpers for navigation zoom and custom bounds work

If you approach shared transitions as a layout matching system instead of a preset animation system, the rest of the API starts to make sense quickly.
