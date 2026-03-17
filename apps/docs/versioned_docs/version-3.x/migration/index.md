---
title: Migration Notes
sidebar_position: 1
---

# Migration Notes

This `3.x` snapshot is frozen to the v3.3 stable API. If you are evaluating unreleased changes, use the separate `Next` docs lane instead of mixing the two surfaces.

## Current 3.3 migration rules

### Keep the flat interpolator return shape

Stable v3.3 uses flat keys:

```tsx
return {
  contentStyle: { opacity: 1 },
  backdropStyle: { opacity: 0.5 },
  "hero-image": { opacity: 1 },
};
```

`overlayStyle` still exists as a deprecated alias, but the stable path is `contentStyle` + `backdropStyle` + custom `styleId` keys.

### Keep numeric snap points and `expandViaScrollView`

In v3.3:

- `snapPoints` is an ascending `number[]` of fractions from `0` to `1`
- `expandViaScrollView` controls whether scroll-boundary drags can expand the sheet
- `gestureSnapLocked` freezes gesture-based snap movement while still allowing `snapTo()`

### Keep masked reveals opt-in

If you build reveal-style shared transitions, install `@react-native-masked-view/masked-view` and wrap the destination screen with `Transition.MaskedView`.

## Release-lane expectation

- Stable guidance is preserved under `3.x`
- Unreleased API and behavior shifts land in `Next`

When `v4` starts diverging materially, that work should stay in `Next` until the release is real enough to freeze.
