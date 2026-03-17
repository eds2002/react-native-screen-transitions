---
title: Common Recipes
sidebar_position: 1
---

# Common Recipes

Use the docs for concepts and the demo app for proof.

## Repository recipe map

The Expo demo app under [`apps/e2e`](https://github.com/eds2002/react-native-screen-transitions/tree/main/apps/e2e) is the fastest place to steal real implementations from the current branch.

| Scenario | Repo route |
| --- | --- |
| Modal slide and backdrop | `[stackType]/slide-vertical` |
| Horizontal push | `[stackType]/slide-horizontal` |
| Draggable card | `[stackType]/draggable-card` |
| Elastic card | `[stackType]/elastic-card` |
| Custom backdrop | `[stackType]/custom-backdrop` |
| Custom surface | `[stackType]/custom-background` |
| Stack progress-driven UI | `[stackType]/stack-progress` |
| Bounds and navigation zoom | `[stackType]/bounds/*` |
| Bottom sheets and drawers | `[stackType]/bottom-sheet/*` |
| Overlay stacks | `[stackType]/overlay/*` |
| Touch gating | `[stackType]/touch-gating/*` |
| Gesture ownership | `gestures/*` |
| Performance comparison | `stack-benchmark/*` |

## Suggested build order for a new transition

1. Start from a preset if the motion is close.
2. Move to a custom `screenStyleInterpolator` as soon as you need slot-level control.
3. Add `styleId`, `backdrop`, or `surface` slots for element-specific choreography.
4. Add `sharedBoundTag` or `Transition.Boundary` only when the motion crosses screens.
5. Add navigation zoom or `Transition.MaskedView` when the destination needs to inherit bound geometry.
6. Add snap points only when the surface truly behaves like a sheet.

That order keeps the simplest possible mental model until the design actually needs more structure.
