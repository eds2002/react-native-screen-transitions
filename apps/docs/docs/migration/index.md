---
title: Upgrading to 3.4
sidebar_position: 1
---

# Upgrading to 3.4

If you are already on a late 3.x build, this upgrade is less about changing the core idea of the library and more about giving that idea more room to breathe.

The biggest changes are around bounds, slot-based interpolation, snap sheets, and hook targeting.

## Navigation masking moved out of Transition.MaskedView

For this type of masking, older flows were usually built with `Transition.MaskedView`.

Navigation masking for bounds zoom is now handled at the screen level with `navigationMaskEnabled`.

`maskEnabled` exists as a deprecated alias for `navigationMaskEnabled`, but that alias is not the important migration story. The real change is moving away from the old `Transition.MaskedView` approach for navigation masking.

If you need to customize the navigation mask animation itself, the package now also exposes public style ids:

- `NAVIGATION_CONTAINER_STYLE_ID`
- `NAVIGATION_MASK_STYLE_ID`
- `NAVIGATION_MASK_HOST_FLAG_STYLE_ID`

## Prefer slot-based interpolator output

The canonical return shape is:

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

## Prefer sheetScrollGestureBehavior over expandViaScrollView

`expandViaScrollView` is deprecated. Use:

- `"expand-and-collapse"`
- `"collapse-only"`

That expresses the behavior directly instead of forcing a boolean to carry multiple meanings.

## Move legacy shared-bound flows to Transition.Boundary

If you were previously relying on `sharedBoundTag` with `Transition.View` or `Transition.Pressable`, the direction now is to move those flows to `Transition.Boundary`.

```tsx
<Transition.Boundary.Pressable id="album-art" group="gallery" />
```

That is now the default bounds model going forward. The older shared-bound path is the legacy path and is expected to disappear in the next major version.

## New capabilities worth adopting

- `bounds({ id }).navigation.zoom()` and grouped navigation zoom helpers
- `snapPoints: ["auto", 1]` for intrinsic detents
- `surfaceComponent` plus the `surface` slot
- ancestor targeting for `useScreenAnimation()` and `useScreenGesture()`
