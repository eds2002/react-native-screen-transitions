---
title: Recipes
sidebar_position: 1
---

# Recipes

Use the docs for concepts and the demo app for proof.

## Repository recipe map

The Expo demo app under [`apps/e2e`](https://github.com/eds2002/react-native-screen-transitions/tree/main/apps/e2e) already contains concrete scenarios you can copy from:

| Scenario | Repo route |
| --- | --- |
| Modal slide and backdrop | `blank-stack/slide-vertical`, `native-stack/slide-vertical` |
| Horizontal push | `blank-stack/slide-horizontal`, `native-stack/slide-horizontal` |
| Draggable card | `blank-stack/draggable-card` |
| Elastic card | `blank-stack/elastic-card` |
| Stack progress-driven UI | `blank-stack/stack-progress/*`, `native-stack/stack-progress/*` |
| Shared bounds basics | `blank-stack/active-bounds/*`, `native-stack/active-bounds/*` |
| Gesture-synced bounds | `blank-stack/gesture-bounds/*`, `native-stack/gesture-bounds/*` |
| Masked + styleId bounds | `blank-stack/style-id-bounds/*`, `native-stack/style-id-bounds/*` |
| Bottom sheets and drawers | `blank-stack/bottom-sheet/*` |
| Overlay stacks | `blank-stack/overlay/*`, `native-stack/overlay/*` |
| Touch gating | `blank-stack/touch-gating/*` |
| Gesture ownership | `gestures/*` |

## Suggested build order for a new transition

1. Start from a preset if the motion is close.
2. Move to a custom `screenStyleInterpolator` as soon as you need direct `contentStyle` or `backdropStyle` control.
3. Add `styleId` targets for element-specific choreography.
4. Add `sharedBoundTag` and `bounds()` only when the motion crosses screens.
5. Add `Transition.MaskedView` only when the destination needs clipped reveal-style motion.
6. Add snap points only when the surface truly behaves like a sheet.

That order keeps the simplest possible mental model until the design actually needs more structure.
