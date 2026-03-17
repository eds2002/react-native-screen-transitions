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
| Modal slide and backdrop | `[stackType]/slide-vertical` |
| Horizontal push | `[stackType]/slide-horizontal` |
| Draggable card | `[stackType]/draggable-card` |
| Elastic card | `[stackType]/elastic-card` |
| Custom backdrop or background | `[stackType]/custom-backdrop`, `[stackType]/custom-background` |
| Stack progress-driven UI | `[stackType]/stack-progress` |
| Shared bounds experiments | `[stackType]/bounds/*` |
| Bottom sheets and drawers | `[stackType]/bottom-sheet/*` |
| Overlay stacks | `[stackType]/overlay/*` |
| Touch gating | `[stackType]/touch-gating/*` |
| Gesture ownership | `gestures/*` |

## Suggested build order for a new transition

1. Start from a preset if the motion is close.
2. Move to a custom `screenStyleInterpolator` as soon as you need slot-level control.
3. Add `styleId` targets for element-specific choreography.
4. Add `sharedBoundTag` or `Transition.Boundary` only when the motion crosses screens.
5. Add snap points only when the surface truly behaves like a sheet.

That order keeps the simplest possible mental model until the design actually needs more structure.
