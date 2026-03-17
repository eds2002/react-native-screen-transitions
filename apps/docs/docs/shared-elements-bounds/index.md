---
title: Shared Elements and Bounds
sidebar_position: 1
---

# Shared Elements and Bounds

The package supports two related but different ideas:

- **shared bounds pairing** through matching elements across screens
- **bounds helpers** for navigation-aware zoom and mask-based transitions

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

## Reach for `Transition.Boundary` when a screen gets complex

`Transition.Boundary` helps isolate or group related measured elements so shared transitions remain deterministic as the tree gets deeper.

That matters when:

- the same visual pattern appears multiple times on screen
- nested flows create competing matches
- source and destination routes render multiple candidate elements

## Navigation zoom

The library also exposes bounds helpers for navigation zoom-style motion. In practice, this usually pairs with:

- `bounds().navigation.zoom()`
- `navigationMaskEnabled`
- a masked view implementation

If you are building zoom transitions, enable masking early and treat layout correctness as part of the animation system, not as a later polish pass.

## When to use `remeasureOnFocus`

Set `remeasureOnFocus` on a shared element if its layout can change while the screen is unfocused. Typical example: a list or scroll position is updated from another route, and the shared source should refresh before the next transition.
