---
title: Shared Elements and Bounds
sidebar_position: 1
---

# Shared Elements and Bounds

The package supports two related but different ideas:

- **shared bounds pairing** through matching elements across screens
- **bounds helpers** for interpolating position, size, and content alignment

## Pair elements with `sharedBoundTag`

Any transition-aware component can opt into shared measurement:

```tsx
<Transition.View sharedBoundTag="profile-avatar">
  <Avatar />
</Transition.View>
```

If another screen renders the same tag, the package can interpolate between the two layouts during the transition.

## Target specific elements with `styleId`

Use `styleId` when you want the screen interpolator to drive a specific element:

```tsx
<Transition.View styleId="hero-image">
  <Image source={photo} />
</Transition.View>
```

Then return a matching key from `screenStyleInterpolator`.

```tsx
screenStyleInterpolator: ({ progress }) => {
  "worklet";
  return {
    "hero-image": {
      opacity: progress,
    },
  };
};
```

## Use `bounds()` for layout-driven motion

The bounds helper computes styles from matching measurements:

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";
  return {
    avatar: bounds({ id: "avatar", method: "transform" }),
  };
};
```

The main methods in v3.3 are:

- `"transform"` for translate + scale
- `"size"` for translate + width/height changes
- `"content"` for screen-level alignment during reveal-style transitions

## Use `Transition.MaskedView` for reveal-style shared screens

If the destination screen should be clipped to the animating bound, wrap it with `Transition.MaskedView` and install `@react-native-masked-view/masked-view`.

That is how the stable `style-id-bounds` demos create the reveal effect while separate `styleId` targets animate the mask and content container independently.

## When to use `remeasureOnFocus`

Set `remeasureOnFocus` on a shared element if its layout can change while the screen is unfocused. Typical example: a list or scroll position is updated from another route, and the shared source should refresh before the next transition.
