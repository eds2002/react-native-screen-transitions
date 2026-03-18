---
title: Hooks and Coordination
sidebar_position: 5
---

# Hooks and Coordination

The hooks are how you read the transition system from inside your own UI.

## useScreenAnimation()

Use `useScreenAnimation()` when you need live transition values inside a component.

That gives you access to things like:

- `progress`
- `stackProgress`
- `snapIndex`
- `current`, `previous`, `next`
- `active`, `inactive`
- `bounds()`
- `layouts.screen` and `layouts.content`

```tsx
const animation = useScreenAnimation();

const style = useAnimatedStyle(() => ({
  opacity: interpolate(animation.value.current.progress, [0, 1], [0, 1]),
}));
```

## useScreenGesture()

Use `useScreenGesture()` when you need to coordinate your own pan gesture with the screen navigation gesture.

```tsx
const screenGesture = useScreenGesture();

const pan = Gesture.Pan()
  .waitFor(screenGesture)
  .onUpdate(() => {
    // your logic
  });
```

## Target selection

Both hooks can now read from somewhere other than the current screen:

- `"self"`
- `"parent"`
- `"root"`
- `{ ancestor: number }`

```tsx
const parentGesture = useScreenGesture("parent");
const rootAnimation = useScreenAnimation("root");
const grandparentAnimation = useScreenAnimation({ ancestor: 2 });
```

This matters in nested stacks, sheets inside flows, and gesture-heavy layouts where a child needs to coordinate with something higher in the branch.

## useScreenState()

Use `useScreenState()` when you need navigation state without the animated values.

That is usually the right tool for route-aware UI, overlays, and screen metadata where a worklet-driven animation object would just be overkill.

## useHistory()

Use `useHistory()` when transitions depend on how the user arrived at the current screen instead of only where they are now.

It is the most specialized hook in the set, but it becomes useful once flows get non-linear and transition decisions become path-aware.

## Practical rule

Use hooks to read the system, not to hide it. If the transition becomes hard to reason about, simplify the transition model before adding another layer of coordination logic.
