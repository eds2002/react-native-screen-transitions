---
title: Presets
sidebar_position: 1
---

# Presets

Presets are there to accelerate you, not to trap you.

Use them in two ways:

- ship them directly when the effect already matches your product
- treat them as a starting point and override specific config

## Built-in presets

| Preset | When to use it |
| --- | --- |
| `SlideFromTop()` | Inverted vertical entry, utility surfaces, stacked reveals |
| `SlideFromBottom()` | Modal-style sheets and card entry from below |
| `ZoomIn()` | Lightweight scale-and-fade transitions |
| `DraggableCard()` | Cards that should respond to bidirectional drag |
| `ElasticCard()` | Gesture-heavy card interactions with stretch and overlay feel |
| `SharedIGImage()` | Instagram-like shared image presentation |
| `SharedAppleMusic()` | Large media transitions with Apple Music-style presence |
| `SharedXImage()` | X-style image expansion and collapse |

## Overriding a preset

Presets return a `ScreenTransitionConfig`, so you can spread them and override the parts you care about:

```tsx
options={{
  ...Transition.Presets.SlideFromBottom({
    backdropBehavior: "dismiss",
  }),
  transitionSpec: {
    open: { stiffness: 620, damping: 46 },
    close: { stiffness: 520, damping: 44 },
  },
}}
```

## When to stop using a preset

Move to a custom interpolator when:

- the relationship between current and previous screen matters
- you need `surface` or `backdrop` animated props
- you want slot-specific choreography with `styleId`
- a preset gets overridden so heavily that it is no longer telling the truth
