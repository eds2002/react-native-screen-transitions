---
title: Quickstart
sidebar_position: 2
---

# Quickstart

The fastest path is `blank-stack`: it gives you full transition control without hiding the moving pieces.

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

## 2. Switch to your own interpolator when presets stop being enough

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

## 3. Expo Router

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

The repository ships an Expo app under [`apps/e2e`](https://github.com/eds2002/react-native-screen-transitions/tree/main/apps/e2e) with routes for:

- bottom sheets and drawers
- shared bounds transitions
- gesture ownership and ScrollView handoff
- overlays and touch gating
- stack progress and benchmark scenarios

When a guide here feels high-level, the demo app is the implementation reference.
