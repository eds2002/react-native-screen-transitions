# react-native-screen-transitions


| iOS | Android |
|---------|---------|
|<video src="https://github.com/user-attachments/assets/8a7b8006-f165-4a78-b0f9-c94cddd948b9" width="300" controls></video>|<video src="https://github.com/user-attachments/assets/ddebdaa8-a929-43ab-b857-08a00e142343" width="300" controls></video>|


**WIP**: This package is a work-in-progress. It provides customizable screen transition animations for React Native apps, primarily designed for use with `expo-router` and `react-navigation`. It supports gestures, predefined presets, and custom animations, making it easy to add polished transitions to your navigation flows.

This library is inspired by the transition system in `@react-navigation/stack` (not the native stack). If you're familiar with how transitions work there (e.g., using interpolators), you'll find this similar.




## Features
- Predefined animation presets (e.g., SlideFromTop, ZoomIn, DraggableCard).
- Gesture support for interactive transitions (e.g., drag-to-dismiss).
- Animations using Reanimated.
- Easy integration with expo-router and react-navigation.

## Compatibility
- **Platforms**: Currently tested on iOS and Android. Not tested or intended for web—web support is not a priority and may not work due to gesture and animation differences.
- **Dependencies**: Requires React Native, Reanimated, Gesture Handler, and either expo-router or react-navigation.

## Installation
```bash
npm install react-native-screen-transitions
# or
yarn add react-native-screen-transitions
# or
bun add react-native-screen-transitions
```

## Peer Dependencies
```bash
npm install react-native-reanimated react-native-gesture-handler
```

## Usage

### Integration with expo-router
In expo-router, you can define transitions in your root layout (`app/_layout.tsx`) using the `listeners` prop on `Stack.Screen`. Wrap your app in `GestureHandlerRootView` for gesture support.

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Transition from "react-native-screen-transitions";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <Stack>
        <Stack.Screen
          name="index"
          listeners={Transition.createConfig}
        />
        <Stack.Screen
          name="a"
          options={Transition.defaultScreenOptions()}
          listeners={(l) =>
            Transition.createConfig({
              ...l,
              ...Transition.presets.SlideFromTop(),
            })
          }
        />
        {/* Add more screens with presets */}
      </Stack>
    </GestureHandlerRootView>
  );
}
```

**Note**: `Transition.defaultScreenOptions()` returns the required screen options for animations to work properly. It sets `presentation: "containedTransparentModal"`, `headerShown: false`, and `animation: "none"` to ensure the library can control the transition animations.

For grouped routes with layouts (e.g., `app/group-a/_layout.tsx`), wrap the nested `Stack` in `Transition.View` to enable transitions:

```tsx
// app/group-a/_layout.tsx
import { Stack } from "expo-router";
import Transition from "react-native-screen-transitions";

export default function GroupLayout() {
  return (
    <Transition.View>
      <Stack>
        <Stack.Screen name="a" />
        {/* Nested screens */}
      </Stack>
    </Transition.View>
  );
}
```

### Integration with react-navigation
For react-navigation, use `createNativeStackNavigator` and apply transitions via `listeners` and `options`.

```tsx
// App.tsx
import { createStaticNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Transition from "react-native-screen-transitions";
import { Home } from "./screens/Home"; // Your screens
import { ScreenA } from "./screens/ScreenA";

const RootStack = createNativeStackNavigator({
  screens: {
    Home: {
      screen: Home,
      listeners: Transition.createConfig,
    },
    ScreenA: {
      screen: ScreenA,
      options: Transition.defaultScreenOptions(),
      listeners: (l) =>
        Transition.createConfig({
          ...l,
          ...Transition.presets.SlideFromTop(),
        }),
    },
    // Add more screens
  },
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {
  return (
    <GestureHandlerRootView>
      <Navigation />
    </GestureHandlerRootView>
  );
}
```

For nested navigators, wrap them in `Transition.View` similar to expo-router.

### Predefined Presets
Use these out-of-the-box animations via `Transition.presets`:

- `SlideFromTop()`: Screen slides in from the top.
- `ZoomIn()`: Screen zooms in from the center.
- `SlideFromBottom()`: Screen slides in from the bottom.
- `DraggableCard()`: Interactive card-like drag gesture.
- `ElasticCard()`: Elastic bounce effect on drag.

Example:
```tsx
listeners={(l) => Transition.createConfig({ ...l, ...Transition.presets.DraggableCard() })}
```

### Defining your own screen animations
There are two ways to define custom animations: at the navigator level using `screenStyleInterpolator` (recommended for animating both screens simultaneously), or at the screen level using `useScreenAnimation` hook.

#### Method 1: Navigator-Level Interpolator (Recommended)
Define a `screenStyleInterpolator` at the navigator level to animate both the entering and exiting screens simultaneously. This approach provides the most control.

```tsx
// app/_layout.tsx
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Transition from "react-native-screen-transitions";
import { interpolate, Easing } from "react-native-reanimated";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <Stack>
        <Stack.Screen
          name="a"
          listeners={Transition.createConfig} // Add blank config so system knows what to animate
        />
        <Stack.Screen
          name="b"
          options={Transition.defaultScreenOptions()}
          listeners={(l) =>
            Transition.createConfig({
              ...l,
              gestureDirection: "horizontal",
              gestureEnabled: true,
              gestureResponseDistance: 50,
              gestureVelocityImpact: 0.3,
              screenStyleInterpolator: ({
                current,
                next,
                layouts: { screen: { width } },
              }) => {
                "worklet";

                const progress = current.progress.value + (next?.progress.value || 0);

                const translateX = interpolate(
                  progress,
                  [0, 1, 2],
                  [width, 0, width * -0.3],
                  "clamp"
                );

                return {
                  contentStyle: {
                    transform: [{ translateX }],
                  },
                };
              },
              transitionSpec: {
                open: {
                  easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
                  duration: 1000,
                },
                close: {
                  damping: 10,
                  mass: 0.5,
                  stiffness: 100,
                },
              },
            })
          }
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

When using `screenStyleInterpolator`, both screens must wrap their content in `Transition.View`:

```tsx
// a.tsx
import Transition from 'react-native-screen-transitions';

export default function A() {
  return (
    <Transition.View>
      {/* Your content */}
    </Transition.View>
  );
}

// b.tsx
import Transition from 'react-native-screen-transitions';

export default function B() {
  return (
    <Transition.View>
      {/* Your content */}
    </Transition.View>
  );
}
```

#### Method 2: Screen-Level Animations
Alternatively, define animations at the screen level using the `useScreenAnimation` hook. This is useful for screen-specific effects or when you don't need to animate both screens.

```tsx
// app/_layout.tsx
<Stack.Screen
  name="a"
  listeners={Transition.createConfig}
/>
<Stack.Screen
  name="b"
  options={Transition.defaultScreenOptions()}
  listeners={(l) =>
    Transition.createConfig({
      ...l,
      transitionSpec: {
        open: {
          easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
          duration: 1000,
        },
        close: {
          damping: 10,
          mass: 0.5,
          stiffness: 100,
        },
      },
    })
  }
/>
```

```tsx
// a.tsx (previous screen)
import { useScreenAnimation } from 'react-native-screen-transitions';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';

export default function A() {
  const { next, layouts: { screen: { width } } } = useScreenAnimation();

  const animatedStyle = useAnimatedStyle(() => {
    // Unfocusing animation - screen slides left when next screen enters
    const translateX = interpolate(next?.progress.value || 0, [0, 1], [0, width * -0.3]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {/* Your content */}
    </Animated.View>
  );
}

// b.tsx (entering screen)
import { useScreenAnimation } from 'react-native-screen-transitions';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';

export default function B() {
  const { current, layouts: { screen: { width } } } = useScreenAnimation();

  const animatedStyle = useAnimatedStyle(() => {
    // Focusing animation - screen slides in from right
    const translateX = interpolate(current.progress.value, [0, 1], [width, 0]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {/* Your content */}
    </Animated.View>
  );
}


```


### Known Issues and Roadmap
This is a WIP package, so expect improvements. Current known issues:
- **Gestures with ScrollViews**: Gestures can be wonky when combined with scrollable content. For example, if a screen defines vertical dismissal gestures and contains a vertical `ScrollView`, the gesture may not trigger reliably (conflicts with scroll handling).
- **Gestures Dismisall with Nested Navigators**: When using nested navigators with gesture dismissal enabled, dismissing a nested screen via gesture may cause the transparent modal to appear dismissed while remaining open. This affects the visual state but not the actual navigation state.
- **Web Support**: Not intended or tested for web—focus is on mobile (iOS/Android). Web may have issues with gestures and animations.


### Note:

This package is something I'll work on in my freetime. However, you can see the roadmap I plan on following in the coming future.

Roadmap:
- Fix gesture conflicts with ScrollViews (e.g., better gesture priority handling).
- Add more presets and customization options.
- Improve documentation and examples.
- Potential web support if demand arises.
- Testing for more edge cases (e.g., modals, tabs).

See the examples in `/examples/expo-router-example` and `/examples/react-nav-example` for full demos.

## License
MIT
