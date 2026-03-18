---
title: Custom Transitions
sidebar_position: 2
---

# Custom Transitions

Presets get you moving fast, but custom transitions are where this library actually earns its keep.

The core model is slot-based interpolation. Instead of returning one giant style blob, you return a map of visual layers and targeted elements.

Every `screenStyleInterpolator` must include `"worklet"` at the top of the function body.

## The main slots

The built-in slots are:

- `content` for the main screen content
- `backdrop` for the layer between screens
- `surface` for a custom animated surface, if you provide a `surfaceComponent`

You can also return your own keys for any transition-aware component using `styleId`.

```tsx
options={{
  screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
    "worklet";

    return {
      content: {
        style: {
          opacity: progress,
          transform: [
            {
              translateY: interpolate(
                progress,
                [0, 1, 2],
                [screen.height * 0.08, 0, -screen.height * 0.04],
              ),
            },
          ],
        },
      },
      backdrop: {
        style: {
          backgroundColor: "black",
          opacity: interpolate(progress, [0, 1], [0, 0.35]),
        },
      },
      surface: {
        style: {
          transform: [{ scale: interpolate(progress, [0, 1], [0.96, 1]) }],
        },
      },
      "hero-image": {
        style: {
          borderRadius: interpolate(progress, [0, 1], [28, 18]),
        },
      },
    };
  },
}}
```

## styleId is your element channel

Use `styleId` when one element needs animation treatment separate from the rest of the screen.

```tsx
const MotionView = Transition.createTransitionAwareComponent(View);

<MotionView styleId="hero-image">
  <Image source={photo} />
</MotionView>
```

This is what lets you animate masks, cards, labels, and media independently without breaking the rest of the transition model.

## surfaceComponent is the new background story

The render layers are:

- `content` drives the screen content motion
- `surfaceComponent` renders a custom animated shell inside that motion layer
- `surface` drives the styles and props for that shell

If you do not provide a `surfaceComponent`, the `surface` slot is not a big deal. It only matters when you actually want a separate animated surface layer.

## Slots can animate props too

A slot can return `style`, `props`, or both.

That matters for custom backdrops and surfaces where the interesting animation target is not just style. Blur intensity, corner smoothing, or custom visual props all fit here cleanly.

## Backward compatibility

Legacy flat keys still work:

- `contentStyle`
- `backdropStyle`
- `overlayStyle`

But they are the compatibility path now. New transition work should use slots.

## Practical rule

If the motion is product-specific, let it be product-specific. This library is supposed to give you enough structure to express your transition clearly, not force every transition back into preset-shaped abstractions.
