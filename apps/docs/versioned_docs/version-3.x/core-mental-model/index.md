---
title: Core Mental Model
sidebar_position: 1
---

# Core Mental Model

The package becomes predictable once you anchor on two ideas:

1. every screen exposes transition state
2. your interpolator returns screen styles plus optional element-specific styles

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
- `layouts.screen`
- `bounds()`
- safe-area `insets`

## Return screen styles and custom ids

The interpolator returns a small style object:

```tsx
return {
  contentStyle: {
    opacity: 1,
  },
  backdropStyle: {
    opacity: 0.45,
    backgroundColor: "black",
  },
  "hero-image": {
    opacity: 1,
    borderRadius: 24,
  },
};
```

The important keys are:

- `contentStyle`: the main screen content layer
- `backdropStyle`: the layer between screens
- `overlayStyle`: deprecated alias for `backdropStyle`
- custom ids like `"hero-image"`: styles attached to `Transition.View` or other transition-aware components through `styleId`

## The default export is your transition toolkit

The root export gives you the high-level pieces:

- `Transition.Presets`
- `Transition.Specs`
- `Transition.MaskedView`
- `Transition.View`, `Transition.Pressable`, `Transition.ScrollView`, `Transition.FlatList`
- `createTransitionAwareComponent`

That means you do not need to wire separate wrappers for every animated target. The package already exposes transition-aware primitives for common cases.

## Shared bounds are layout-driven, not magic

For cross-screen choreography, the main inputs are:

- `sharedBoundTag` to pair matching elements
- `styleId` to target a specific element from the interpolator
- `bounds()` helpers to compute transform, size, or content-alignment styles
- `Transition.MaskedView` when the destination needs a clipped reveal effect

If you approach shared transitions as a layout matching system instead of a preset animation system, the rest of the API starts to make sense quickly.
