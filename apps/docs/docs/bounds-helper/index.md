---
title: bounds(...) Helper
sidebar_position: 4
---

# bounds(...) Helper

`bounds(...)` is the worklet helper you receive inside every `screenStyleInterpolator`.

It is the read-and-compute layer that sits between `Transition.Boundary` and the styles you return from the interpolator.

## What it does

`bounds(...)` has two jobs:

- compute element-level bound styles
- expose `navigation.zoom()` for screen-level zoom recipes

That means the primitive and the helper are related, but not the same thing:

- `Transition.Boundary` defines measured participants
- `bounds(...)` reads those measurements and turns them into styles

## Basic shape

You use it inside the interpolator like this:

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";

  return {
    "hero-image": {
      style: bounds({
        id: "album-art",
        scaleMode: "uniform",
      }),
    },
  };
}
```

That call returns element-level styles for the resolved bound pair.

The same accessor also exposes navigation zoom:

```tsx
screenStyleInterpolator: ({ bounds, current, active }) => {
  "worklet";
  const id = current.route.params?.id ?? active.route.params?.id;

  if (!id) {
    return {};
  }

  return {
    ...bounds({ id }).navigation.zoom(),
  };
}
```

## How resolution works

Every `bounds(...)` call follows the same pipeline:

1. Resolve the tag from `id` and optional `group`
2. Read boundary config for that tag from the current screen
3. Merge defaults, boundary config, and call-site overrides
4. Compute styles from the active source/destination relationship

The important defaults are:

- `target: "bound"`
- `method: "transform"`
- `scaleMode: "match"`
- `anchor: "center"`

If the matching `Transition.Boundary` already declared `anchor`, `scaleMode`, `target`, or `method`, that config is picked up automatically. If the `bounds(...)` call also provides them, the call-site wins.

## What the runtime stores

The bounds runtime is built around four buckets per tag:

- `snapshots`: latest measured bounds per screen
- `linkStack`: recent source to destination pairs
- `presence`: mounted boundary presence plus boundary config
- `groups`: active id per group

That store shape is what lets the helper keep working across push, dismiss, regrouping, and remeasurement.

## How a pair is actually resolved

The runtime does not simply do "links first, then snapshots" as one binary step.

It first picks the best link candidate for the current transition context, then fills any missing source or destination side independently from snapshots if needed.

High-level behavior:

- source measurement creates or refreshes the source side of a link
- destination measurement completes or refreshes the destination side
- completed links are preferred when they match the current context
- pending links still matter while a destination is coming online
- missing sides can still be filled from snapshots

The history is intentionally short. `linkStack` is capped to the most recent `3` entries per tag.

## Freshness paths in the current branch

The current branch has multiple freshness paths, not just one generic source-write and destination-write flow:

- press-priority source capture for `Transition.Boundary.Pressable`
- auto-source capture when matching destination presence appears
- initial destination capture
- destination retry capture during transition progress
- grouped destination refresh when the active id changes
- grouped source refresh after settled scroll

There is also measurement gating:

- destination writes are viewport-aware
- snapshot writes are deduped before store updates

That is why the current bounds behavior is more reliable than the older shared-bound path.

## id and group

For style computation and zoom, you pass `id` and `group` separately:

```tsx
bounds({
  id: activePhotoId.value,
  group: "gallery",
})
```

Internally, grouped bounds resolve to `group:id`.

That is why grouped flows stay isolated:

- `gallery:1` and `gallery:2` are different links
- changing the active id changes which member is resolved

The helper also updates the active group id during grouped resolution, so grouped lookup is not just passive tagging.

## Core options

### id

The bound member you want to resolve.

### group

Optional collection scope. Use it when many items share one transition family.

### anchor

Controls which point stays aligned between source and destination.

Use it when the motion should feel locked to the top, center, trailing edge, and so on.

### scaleMode

Controls how source and destination scale relative to each other.

The main modes are:

- `match`
- `uniform`
- `none`

### target

Controls what the bound should aim at.

The common targets are:

- `"bound"` for a real matching destination bound
- `"fullscreen"` for screen takeover behavior
- a custom measured target object when you need explicit geometry

Fullscreen or derived targets can work without a destination boundary. If you want to target a real destination bound, that destination has to exist as a participant.

### method

Controls how the motion is expressed:

- `"transform"`: translate and scale
- `"size"`: translate plus width and height
- `"content"`: align the screen content itself to the bound relationship

`method: "content"` is screen-content ownership. In practice you usually return it on the `content` slot, not on the bound wrapper itself.

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";

  return {
    content: {
      style: bounds({
        id: "album-art",
        method: "content",
        scaleMode: "uniform",
      }),
    },
  };
}
```

### raw

If `raw` is `true`, you get raw computed values instead of the final style object.

That is the low-level path for custom math. The returned shape depends on the method:

- `transform`: translate and scale values
- `size`: translate and width/height values
- `content`: translate and scale values for screen-content ownership

## Element styles vs navigation.zoom()

These two paths solve different problems.

### Element-level bounds(...)

Use plain `bounds(...)` when you want styles for a measured relationship.

That usually means:

- animating a specific `styleId`
- styling a bound element directly
- building custom choreography from source/destination measurements

Element-level bounds styles are computed in relative space.

### bounds(...).navigation.zoom()

Use `navigation.zoom()` when the whole screen should inherit bound geometry.

That is a screen-level helper built on top of the same bounds resolution pipeline, but it returns slot output for the transition, not just one style object.

Open [Navigation Zoom](/docs/navigation-zoom) for the actual recipe guidance.

## Inspection helpers

The accessor also exposes lower-level helpers for reads and interpolation.

### bounds.getLink(tag)

Returns the active resolved link for the current screen.

For grouped flows, pass the fully resolved tag string:

```tsx
const link = bounds.getLink(`gallery:${activePhotoId.value}`);
```

Use this when you need to inspect the current source and destination pair directly.

### bounds.getSnapshot(tag, key)

Returns the stored measurement snapshot for a specific route key.

```tsx
const sourceSnapshot = bounds.getSnapshot("album-art", previous.route.key);
```

For grouped flows, this is also tag-based, so use `group:id`.

### bounds.interpolateStyle(tag, property, fallback)

Interpolates a numeric style property across the active link.

```tsx
const radius = bounds.interpolateStyle("album-art", "borderRadius", 0);
```

Use it when you want a numeric style value without rebuilding the whole bounds style object yourself.

### bounds.interpolateBounds(tag, property, fallbackOrTargetKey, fallback)

Interpolates a numeric bounds property.

There are two useful modes:

- active-link interpolation
- interpolation against a specific stored snapshot route key

```tsx
const liveWidth = bounds.interpolateBounds("album-art", "width", 0);

const widthFromPreviousSnapshot = bounds.interpolateBounds(
  "album-art",
  "width",
  previous.route.key,
  0,
);
```

This is the lower-level path when you want direct access to width, height, page position, and similar geometry.

## When to reach for which layer

Use the three bounds layers like this:

- [Bounds](/docs/shared-elements-bounds) for the primitive and matching rules
- `bounds(...)` when you need measured style computation
- [Navigation Zoom](/docs/navigation-zoom) when the screen itself should take over from the bound

If you keep those responsibilities separate, the API gets much easier to reason about.
