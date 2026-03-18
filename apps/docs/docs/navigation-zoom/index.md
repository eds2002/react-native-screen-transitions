---
title: Navigation Zoom
sidebar_position: 2
---

# Navigation Zoom

`bounds(...).navigation.zoom()` is the screen-level recipe for taking a measured source element and letting the destination screen inherit its geometry on the first frame.

This is the path for card expansion, image zoom, media viewers, and similar full-screen takeovers.

## Simple id-only zoom

The simplest flow is one source boundary plus a screen-level interpolator.

```tsx
<Transition.Boundary.Pressable
  id={item.id}
  onPress={() => router.push(`/detail/${item.id}`)}
>
  <Image source={item.image} />
</Transition.Boundary.Pressable>
```

```tsx
options={{
  navigationMaskEnabled: true,
  screenStyleInterpolator: ({ bounds, current, active }) => {
    "worklet";
    const id = current.route.params?.id ?? active.route.params?.id;

    if (!id) {
      return {};
    }

    return {
      ...bounds({ id }).navigation.zoom(),
    };
  },
}}
```

That is enough for the basic zoom pattern.

## A destination boundary is not always required

For simple id-only zoom, the destination screen does not have to define a `Transition.Boundary`.

The clean proof is `[stackType]/bounds/zoom-id`:

- the source list uses `Transition.Boundary.Pressable`
- the layout uses `bounds({ id }).navigation.zoom()`
- the detail screen does not define a destination boundary

That works because navigation zoom can derive a screen target from the source measurement and the current screen layout.

This is the right choice when the destination is just normal screen content and does not need to remain a measured bound participant.

## When the destination does need a boundary

Add a destination boundary when the zoom should land on a real target component on the destination screen, not just on the screen as a whole.

If the source and destination components are effectively the same structure, wrapping the destination target in `Transition.Boundary.View` gives you the cleaner handoff. The destination screen can position itself so the destination bound matches the source bound before the rest of the screen settles into place.

That is usually the right move when:

- you want a seamless component-to-component transition
- the destination screen still renders the active item as a real visual target
- a grouped or paged detail flow should stay locked to the currently active member
- the destination component itself is part of the effect, not just the fullscreen screen shell

The grouped zoom examples do exactly that:

- `[stackType]/bounds/zoom`
- `[stackType]/bounds/gallery`

Those routes keep destination boundaries because the destination still renders real target components for the active member, so the zoom can land on that destination component instead of only targeting generic screen geometry.

## Grouped zoom

Grouped zoom is the pattern for collections where multiple items share one transition family.

Use the same `id` and `group` in both places:

- the boundary components
- the `navigation.zoom()` call

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";
  const id = activeZoomId.value;

  if (!id) {
    return {};
  }

  return {
    ...bounds({ id, group: ZOOM_GROUP }).navigation.zoom(),
  };
}
```

The active item state is the source of truth here. If the active member changes, the interpolator should resolve the new `id` with the same `group`.

That is how the current grouped zoom and gallery examples stay locked to the correct member.

## Masked vs unmasked zoom

`navigation.zoom()` works with or without `navigationMaskEnabled`.

### Masked zoom

Use `navigationMaskEnabled: true` when you want the navigation container and mask to be ready from the first frame.

If you take this path, install `@react-native-masked-view/masked-view`.

This is also the path for customizing the mask and container through the public style ids:

- `NAVIGATION_CONTAINER_STYLE_ID`
- `NAVIGATION_MASK_STYLE_ID`
- `NAVIGATION_MASK_HOST_FLAG_STYLE_ID`

### Unmasked zoom

You can still use `navigation.zoom()` without `navigationMaskEnabled`.

The animation will look slightly different, but it is a valid supported path.

That tradeoff exists on purpose. One of the reasons is Android, which tends to show more strain when a transition leans heavily on width and height animation.

## Source vs destination Transition.ScrollView

This part matters most in grouped flows.

### Source scroll containers

If the source screen is scrollable and the active grouped item can move while the detail flow is active, prefer `Transition.ScrollView` on the source screen.

That gives you scroll-settled remeasurement:

- the source list scrolls
- `Transition.ScrollView` emits a settled signal
- the active grouped source boundary re-measures
- dismiss now closes back to the updated source position

This is why the grouped source examples use `Transition.ScrollView`.

### Destination scroll containers

The destination does **not** need `Transition.ScrollView` by default.

A plain `ScrollView`, `FlatList`, or other screen content is fine when:

- the destination does not define a boundary
- the destination boundary does not need fresh post-scroll measurements
- the destination is just normal content for the zoomed screen

`[stackType]/bounds/zoom-id` proves this. The detail screen has no destination boundary at all.

`[stackType]/bounds/gallery` is another good reminder that grouped zoom itself does not require a destination `Transition.ScrollView`. The detail route uses a paged `Animated.FlatList`, not `Transition.ScrollView`.

### When destination Transition.ScrollView is useful

Use it on the destination when the destination screen has scrollable content and you want that scroll view to coordinate with the dismiss pan.

`Transition.ScrollView` is connected to the gesture ownership system, so the scroll view can help decide when the pan should take over and when scrolling should keep control.

That is the real reason to reach for it on the destination side: scroll and dismiss awareness, not because navigation zoom itself requires it.

## A practical rule

Use this rule of thumb:

- simple fullscreen takeover: source boundary plus `navigation.zoom()` is often enough
- if the zoom should land on a real destination component: add a destination boundary
- scrollable grouped source: strongly prefer `Transition.ScrollView`
- destination `Transition.ScrollView`: use it when destination scroll content should coordinate with the dismiss pan

## Source routes to study

If you want the real behavior instead of theory, use these example routes:

- `[stackType]/bounds/zoom-id` for source-only id zoom
- `[stackType]/bounds/zoom` for grouped zoom with destination participation
- `[stackType]/bounds/gallery` for active-item gallery behavior

For the underlying API surface, open [bounds(...) Helper](/docs/bounds-helper).
