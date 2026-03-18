---
title: Bounds
sidebar_position: 1
---

# Bounds

Bounds are now centered around `Transition.Boundary`.

That is the default path going forward. The older `Transition.View` / `Transition.Pressable` shared-bound system is the legacy path and will be removed in the next major version.

## What a boundary actually is

A boundary is a measured element that can be paired with another measured element on a different screen.

The pairing key is:

- `id` when you are doing simple one-to-one matching
- `group + id` when the same flow can have many candidate items and only one should be considered active at a time

In practice, boundaries are the right tool when:

- the transition needs to lock onto a real element, not just a preset screen animation
- the same pattern appears many times in a list or grid
- the destination can move after mount
- you want navigation zoom to inherit the geometry of a specific source element

The newer boundary system is not route-param driven. It matches by measured presence and tag resolution.

## Choose the right boundary component

`Transition.Boundary` ships with the two built-in variants you will use most often:

- `Transition.Boundary.View` for passive elements
- `Transition.Boundary.Pressable` for elements that should capture source bounds before starting navigation

Use `Boundary.View` when the element itself is just the measured visual target:

```tsx
<Transition.Boundary.View id="album-art" style={styles.cover}>
  <Image source={photo} />
</Transition.Boundary.View>
```

Use `Boundary.Pressable` when that same measured element is also the tap target that opens the next screen:

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

The difference matters. `Boundary.Pressable` prioritizes source measurement before your `onPress` callback runs. That gives push transitions fresher source geometry on the first frame.

`Boundary.View` can still work fine if you wrap it with some other pressable or handle touches inside it. A few of the examples do exactly that. But if the measured element is the thing that starts navigation, prefer `Boundary.Pressable`.

If you already have your own primitive, make that component boundary-aware instead of rewriting your tree around `View`:

```tsx
const MotionCard = Transition.createBoundaryComponent(Card);

<MotionCard id="album-art" group="gallery">
  <Image source={photo} />
</MotionCard>
```

That factory is the escape hatch for design-system components, custom cards, media cells, or any existing wrapper you want to keep.

## Matching rules

The basic rule is simple: matching is tag-based.

- `id="hero"` matches another boundary with `id="hero"`
- `group="gallery" id="12"` matches another boundary with that same `group` and `id`
- changing the `group` changes the match
- changing the `id` changes the match

Grouped tags are internally treated like `group:id`, which is why grouped members stay isolated from each other. A `gallery:1` transition will not accidentally link to `gallery:2`.

This is what makes grouped collection flows predictable:

- list thumbnail `gallery:1` opens detail page `gallery:1`
- switching the active detail page to `gallery:2` does not corrupt the old `gallery:1` link
- the library keeps each member's history separate

If your flow is truly one source and one destination, stick to `id` only. If your flow is a collection, pager, masonry grid, or carousel where the active item can change, use `group`.

## Boundary options live on the boundary itself

`Transition.Boundary` accepts its bounds configuration directly:

- `anchor`
- `scaleMode`
- `target`
- `method`

That lets the source and destination declare how they want to be paired without forcing all of that logic into the interpolator.

Use them like this:

```tsx
<Transition.Boundary.View
  id="card-1"
  anchor="center"
  scaleMode="uniform"
  method="transform"
  style={styles.card}
>
  <CardContent />
</Transition.Boundary.View>
```

The high-level intent is:

- `anchor`: which point should stay aligned between source and destination
- `scaleMode`: how source and destination scale relative to each other
- `method`: whether the transition is expressed through transforms, explicit size changes, or content alignment
- `target`: whether you are targeting the bound itself, fullscreen, or a custom measured target

The sync harness under `[stackType]/bounds/sync` is the best place to study `anchor`, `scaleMode`, `target`, and `method` in isolation.

## Use group for active-item flows

The `group` prop exists for cases where one logical transition family contains many items.

That usually means:

- a feed opening detail screens
- a gallery where the detail screen can page between items
- a list that scrolls to keep the active item visible
- a grid where multiple members share one transition recipe

In those flows, `group` gives you two things:

- isolated matching per member
- an active member concept the library can refresh as the user moves around

The gallery and grouped navigation zoom examples are the clearest reference:

- `[stackType]/bounds/gallery`
- `[stackType]/bounds/zoom`

## Transition.MaskedView is the legacy masking path

Older bounds flows often used `Transition.MaskedView` directly. That path is being deprecated in favor of `navigationMaskEnabled` plus the public style ids you can target from your interpolator:

- `NAVIGATION_CONTAINER_STYLE_ID`
- `NAVIGATION_MASK_STYLE_ID`
- `NAVIGATION_MASK_HOST_FLAG_STYLE_ID`

That is the path to build against going forward.

## Legacy path vs boundary path

The old shared-bound system was built around `Transition.View` and `Transition.Pressable` using `sharedBoundTag`.

That legacy path is still in the package today, but new work should use `Transition.Boundary`.

The important differences are:

- `Transition.Boundary` is the modern bounds API
- `Transition.View` / `Transition.Pressable` shared-bound flows are legacy
- `Transition.MaskedView` is legacy
- `remeasureOnFocus` belongs to the older transition-aware shared-bound path, not to `Transition.Boundary`

Boundary freshness now comes from the newer behavior:

- press-priority source capture
- pending destination capture and retry
- group-active remeasurement
- scroll-settled source remeasurement in grouped flows

That is why you should not be looking for `remeasureOnFocus` on `Transition.Boundary`.

## Where the next layer lives

Keep this page about the primitive itself:

- `Transition.Boundary` defines the measured participants
- `group` decides collection scoping
- boundary props like `anchor`, `scaleMode`, `target`, and `method` live on the primitive

When you want the computed styles or zoom recipe, move to the next layer:

- [bounds(...) Helper](/docs/bounds-helper) for style computation and lower-level access
- [Navigation Zoom](/docs/navigation-zoom) for full-screen bound takeovers

## Use the examples aggressively

The current branch has a dedicated bounds hub under:

- `[stackType]/bounds/active` for id-only matching
- `[stackType]/bounds/gesture` for gesture-synced bounds behavior
- `[stackType]/bounds/style-id` for legacy shared-bound plus styleId choreography
- `[stackType]/bounds/sync` for `anchor` / `scaleMode` / `target` / `method`
- `[stackType]/bounds/example` for nested-flow bounds usage
- `[stackType]/bounds/spam` for rapid interaction stress testing

Use the dedicated zoom pages for `zoom-id`, `zoom`, and `gallery`.
