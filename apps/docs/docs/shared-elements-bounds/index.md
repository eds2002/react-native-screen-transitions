---
title: Shared Elements & Bounds
sidebar_position: 1
---

# Shared Elements & Bounds

The current 3.4 bounds system gives you a few different levels of control. Start as simple as possible, then move lower only when the screen design actually demands it.

## 1. Use `sharedBoundTag` for simple source and destination pairing

If you just need one element on screen A to animate into one element on screen B, `sharedBoundTag` is still the simplest path.

```tsx
<Transition.View sharedBoundTag="profile-avatar">
  <Avatar />
</Transition.View>
```

If another screen renders the same tag, the library can interpolate between those measurements during the transition.

## 2. Use `styleId` when the interpolator should drive a specific element

`styleId` is for element-specific choreography inside your slot-based interpolator.

```tsx
<Transition.View styleId="hero-image">
  <Image source={photo} />
</Transition.View>
```

```tsx
screenStyleInterpolator: ({ progress }) => {
  "worklet";
  return {
    "hero-image": {
      style: {
        opacity: progress,
      },
    },
  };
};
```

This is especially useful when the mask, container, and content all need different animation treatment.

## 3. Use `Transition.Boundary` when repeated layouts need deterministic matching

`Transition.Boundary` is the 3.4 answer for complex shared motion.

It gives you explicit, repeatable matching through `id`, optional grouping, and boundary-local configuration such as `anchor`, `scaleMode`, `target`, and `method`.

```tsx
<Transition.Boundary.Pressable
  id="album-art"
  group="gallery"
  scaleMode="uniform"
  anchor="top"
  onPress={openDetail}
>
  <Image source={photo} />
</Transition.Boundary.Pressable>
```

Reach for boundaries when:

- the same visual pattern appears multiple times on screen
- nested flows make plain tag matching ambiguous
- you want deterministic shared transitions without pushing route params around just to identify source and destination

## 4. Use navigation zoom when the whole screen should inherit the bound

3.4 adds navigation-aware zoom helpers directly off `bounds()`:

```tsx
options={{
  navigationMaskEnabled: true,
  screenStyleInterpolator: ({ bounds }) => ({
    ...bounds({ id: "album-art", group: "gallery" }).navigation.zoom(),
  }),
}}
```

This is the path to full-screen image, card, and media zoom transitions where the destination screen should inherit the geometry of the source bound on the first frame.

If you use navigation zoom, install `@react-native-masked-view/masked-view`.

## 5. Use `Transition.MaskedView` when you need a custom reveal surface

`Transition.MaskedView` is still useful when the destination needs a reveal-style clip that is not just the stock navigation container mask.

That usually shows up in more custom transitions where the screen content, a mask, and a container all need to animate independently.

## 6. Re-measure when the source can drift

Set `remeasureOnFocus` when the source layout can change while the screen is unfocused. Good examples are lists, galleries, or scroll-driven layouts where the user may come back to a different geometry than the one originally captured.

## Use the example app aggressively

The current branch has a dedicated bounds hub under:

- `[stackType]/bounds/active`
- `[stackType]/bounds/gesture`
- `[stackType]/bounds/style-id`
- `[stackType]/bounds/zoom`
- `[stackType]/bounds/zoom-id`
- `[stackType]/bounds/gallery`
- `[stackType]/bounds/sync`
- `[stackType]/bounds/example`
- `[stackType]/bounds/spam`

If the written docs ever feel too abstract here, those routes are the real source of truth.
