---
title: Upgrading to 3.4
sidebar_position: 1
---

# Upgrading to 3.4

If you are already on a late 3.x build, 3.4 is less about changing the core idea of the library and more about giving that idea more room to breathe.

The biggest changes are around bounds, slot-based interpolation, snap sheets, and hook targeting.

## Prefer `navigationMaskEnabled` over `maskEnabled`

`maskEnabled` is deprecated. Use `navigationMaskEnabled` for bounds navigation masking going forward.

## Prefer slot-based interpolator output

The canonical 3.4 return shape is:

```tsx
return {
  content: {
    style: { opacity: 1 },
  },
  backdrop: {
    style: { opacity: 0.5 },
  },
};
```

Legacy flat keys such as `contentStyle`, `backdropStyle`, and `overlayStyle` still work, but they now live on the backward-compatibility path.

## Prefer `sheetScrollGestureBehavior` over `expandViaScrollView`

`expandViaScrollView` is deprecated. Use:

- `"expand-and-collapse"`
- `"collapse-only"`

That expresses the behavior directly instead of forcing a boolean to carry multiple meanings.

## Move simple shared tags to `Transition.Boundary` when matching gets messy

If repeated layouts, nested flows, or multiple candidate elements were making `sharedBoundTag` brittle, 3.4 gives you a better answer:

```tsx
<Transition.Boundary.Pressable id="album-art" group="gallery" />
```

That boundary model is a real upgrade, not just new syntax.

## New capabilities worth adopting

- `bounds({ id }).navigation.zoom()` and grouped navigation zoom helpers
- `snapPoints: ["auto", 1]` for intrinsic detents
- `surfaceComponent` plus the `surface` slot
- ancestor targeting for `useScreenAnimation()` and `useScreenGesture()`

## Suggested migration order

1. Rename `maskEnabled` to `navigationMaskEnabled`.
2. Rename `expandViaScrollView` to `sheetScrollGestureBehavior`.
3. Move new transition work to slot-based interpolator output.
4. Adopt `Transition.Boundary` where simple tag matching is no longer deterministic.
5. Only after that, start using the newer zoom, auto snap, and ancestor-target APIs.
