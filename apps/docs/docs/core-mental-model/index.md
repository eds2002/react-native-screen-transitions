---
title: Mental Model
sidebar_position: 1
---

# Mental Model

The package becomes predictable once you anchor on three ideas:

1. every screen exposes transition state
2. your interpolator returns styles for named visual slots
3. bounds are measured relationships, not magic

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
- `active`, `inactive`
- `stackProgress`
- `snapIndex`
- `layouts.screen` and `layouts.content`
- `bounds()`
- safe-area `insets`

You should think of those values as a description of the transition graph, not just a number to interpolate.

`screenStyleInterpolator` runs as a worklet, so every interpolator you write should begin with `"worklet"`.

## Return slots, not one giant style blob

The interpolator returns a map of named slots:

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
- `surface`: the animated surface layer inside the screen, if you provide a `surfaceComponent`
- custom ids like `"hero-image"`: styles attached to transition-aware components through `styleId`

Each slot can drive `style`, `props`, or both. That is what lets the system support things like animated blur backdrops, custom surface components, and element-specific choreography without forcing everything into one flat style object.

## The default export is your transition toolkit

The root export gives you the high-level pieces:

- `Transition.Presets`
- `Transition.Specs`
- `Transition.Boundary`
- `Transition.MaskedView` as the deprecated masking path
- `Transition.View`, `Transition.Pressable` as the legacy shared-bound path, plus `Transition.ScrollView`, `Transition.FlatList`
- `createBoundaryComponent`
- `createTransitionAwareComponent`

`Transition.Boundary` is the default bounds path going forward. `Transition.View` and `Transition.Pressable` are still part of the public surface today, but the older shared-bound path built around them is now the legacy path.

If you already have your own building block, you can keep it and make it boundary-aware with `Transition.createBoundaryComponent(MyComponent)`.

## Hooks can read beyond the current screen

Both `useScreenAnimation()` and `useScreenGesture()` can target other levels in the active hierarchy:

- `"self"` for the current screen
- `"parent"` for the immediate parent screen
- `"root"` for the outermost screen in the branch
- `{ ancestor: number }` for explicit depth targeting

That makes deeply nested gestures and coordinated animation reads much easier to express without plumbing refs through half the tree.

## Shared bounds are layout-driven, not magic

For cross-screen choreography, the main inputs are:

- `styleId` to target a specific element from the interpolator
- `Transition.Boundary` to define the actual measured relationship
- `bounds()` helpers to compute styles from that measured relationship
- `bounds(...).navigation.zoom()` as a screen-level recipe built on top of the helper

If you approach shared transitions as a layout matching system instead of a preset animation system, the rest of the API starts to make sense quickly.

## Read next

- [Bounds](/docs/shared-elements-bounds) for the primitive and matching rules
- [bounds(...) Helper](/docs/bounds-helper) for the accessor and lower-level helpers
- [Navigation Zoom](/docs/navigation-zoom) for fullscreen bound takeovers
- [Gestures](/docs/gestures-snap-points) for ownership, scroll handoff, and sheet behavior
