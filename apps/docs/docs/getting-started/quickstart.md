---
title: Quick Start
sidebar_position: 2
---

# Quick Start

The fastest path is `blank-stack`. It gives you full control and matches the mental model the rest of the docs use.

## 1. Create a navigator

```tsx
import Transition from "react-native-screen-transitions";
import { createBlankStackNavigator } from "react-native-screen-transitions/blank-stack";

const Stack = createBlankStackNavigator();

export function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={{
          ...Transition.Presets.SlideFromBottom(),
        }}
      />
    </Stack.Navigator>
  );
}
```

That is enough to get a real screen transition on screen.

## 2. When presets stop being enough, switch to your own interpolator

Every `screenStyleInterpolator` must include `"worklet"` at the top of the function body.

```tsx
import { interpolate } from "react-native-reanimated";

options={{
  screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
    "worklet";

    return {
      content: {
        style: {
          opacity: interpolate(progress, [0, 1, 2], [0, 1, 0]),
          transform: [
            {
              translateY: interpolate(
                progress,
                [0, 1, 2],
                [screen.height * 0.12, 0, -screen.height * 0.06],
              ),
            },
          ],
        },
      },
      backdrop: {
        style: {
          opacity: interpolate(progress, [0, 1], [0, 0.42]),
          backgroundColor: "black",
        },
      },
    };
  },
}}
```

This is the current mental model: return slot styles for the screen content, the backdrop, the surface, or custom `styleId` targets.

## 3. If you use Expo Router, wire the navigator through withLayoutContext

```tsx
import { withLayoutContext } from "expo-router";
import {
  createBlankStackNavigator,
  type BlankStackNavigationOptions,
} from "react-native-screen-transitions/blank-stack";

const { Navigator } = createBlankStackNavigator();

export const Stack = withLayoutContext<
  BlankStackNavigationOptions,
  typeof Navigator
>(Navigator);
```

## 4. Use the demo app as your recipe book

The repository ships an Expo app under [`apps/e2e`](https://github.com/eds2002/react-native-screen-transitions/tree/main/apps/e2e). In the current branch, the main recipe routes are:

- `[stackType]/bottom-sheet/*` for sheets, drawers, snap points, and auto detents
- `[stackType]/bounds/*` for `Transition.Boundary`, style-targeted bounds, and navigation zoom
- `[stackType]/custom-backdrop` and `[stackType]/custom-background` for backdrop and surface customization
- `gestures/*` for ownership, shadowing, nesting, and ScrollView handoff
- `stack-benchmark/*` for performance comparisons and sanity checks

`[stackType]` resolves to `blank-stack` or `native-stack`, so you can compare behavior without learning two different example trees.

## What to read next

- [Mental Model →](../core-mental-model)
- [Stack Variants →](../stack-variants)
- [Bounds →](../shared-elements-bounds)
- [bounds(...) Helper →](../bounds-helper)
- [Navigation Zoom →](../navigation-zoom)
- [Gestures →](/docs/gestures-snap-points)
