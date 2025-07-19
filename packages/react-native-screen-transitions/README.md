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

## Your First Screen Transition

Getting started with screen transitions is simple. Here's how to add your first animated transition:

### 1. Wrap your app with GestureHandlerRootView

```tsx
// app/_layout.tsx (expo-router) or App.tsx (react-navigation)
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Transition from "react-native-screen-transitions";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your navigation setup */}
    </GestureHandlerRootView>
  );
}
```

### 2. Add transition configuration to your screens

```tsx
import { Stack } from "expo-router";
import Transition from "react-native-screen-transitions";

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <Stack>
        <Stack.Screen
          name="a"
          options={{ headerShown: false }}
          {...Transition.createScreenConfig()}
        />
        <Stack.Screen
          name="b"
          {...Transition.createScreenConfig({
            ...Transition.presets.SlideFromTop(),
          })}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

> ⚠️ **Important**: The first screen (like "a" in the example) must include `{...Transition.createScreenConfig()}` for it to be properly controlled by incoming screens.

### 3. Use transition-aware components in your screens

```tsx
// a.tsx
import Transition from "react-native-screen-transitions";

export default function A() {
  return (
    <Transition.View> {/* By default has flex: 1 */}
      {/* Your content */}
    </Transition.View>
  );
}

// b.tsx
import Transition from "react-native-screen-transitions";

export default function B() {
  return (
    <Transition.View>
      {/* Your content */}
    </Transition.View>
  );
}
```

### For Nested Navigators

When using nested navigators, wrap the nested Stack in a transition-aware component:

```tsx
// app/nested/_layout.tsx
import Transition from "react-native-screen-transitions";

export default function TabLayout() {
  return (
    <Transition.View>
      <Stack>
        <Stack.Screen name="nested-a" {...Transition.createScreenConfig()} />
        <Stack.Screen name="nested-b" {...Transition.createScreenConfig()} />
      </Stack>
    </Transition.View>
  );
}
```

## Advanced Usage

### Method 1: Navigator-Level Interpolator (Recommended)

Define a `screenStyleInterpolator` at the navigator level to animate both entering and exiting screens simultaneously. This approach is much cleaner.

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
          {...Transition.createScreenConfig()} // Initialize
        />
        <Stack.Screen
          name="b"
          {...Transition.createScreenConfig({
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
              // Mimics the iOS stack slide animation
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
          })}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

When using `screenStyleInterpolator`, both screens must wrap their content in a transition-aware component.

### Method 2: Screen-Level Animations

Alternatively, define animations at the screen level using the `useScreenAnimation` hook. This is useful for screen-specific effects or when you don't need to animate both screens. You CAN combine this with `screenStyleInterpolator` for more advanced animations, but for this example, we'll leave `screenStyleInterpolator` undefined.

```tsx
// app/_layout.tsx
<Stack.Screen
  name="a"
  {...Transition.createScreenConfig()}
/>
<Stack.Screen
  name="b"
  {...Transition.createScreenConfig({
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
  })}
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
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
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



## Dismissible Screens with Scrollables

Screen transitions can be dismissed based on defined gesture directions. Integration with scrollable components is seamless:

### Create Custom Transition-Aware Scrollables

You can use built-in scrollables or create your own

```tsx
import { FlashList } from "@shopify/flash-list";
import { LegendList } from "@legendapp/list";
import { FlatList, ScrollView } from "react-native";
import Transition from "react-native-screen-transitions";

// Built-in transition-aware scrollables
const MyScrollView = Transition.ScrollView;
const MyFlatList = Transition.FlatList;

// Create custom transition-aware scrollables
const TransitionFlashList = Transition.createTransitionAwareScrollable(FlashList);
const TransitionLegendList = Transition.createTransitionAwareScrollable(LegendList);
```

These components now integrate seamlessly with your transition system and provide smart gesture handling.

### Configure Gesture Directions

```tsx
<Stack.Screen
  name="scrollable-screen"
  {...Transition.createScreenConfig({
    gestureDirection: ["vertical", "vertical-inverted"],
    gestureEnabled: true,
    // ... other config
  })}
/>
```

### Use in Your Screen

```tsx
// scrollable-screen.tsx
export default function ScrollableScreen() {
  return (
    <Transition.ScrollView>
      {/* Your scrollable content */}
    </Transition.ScrollView>
  );
}
```

**Smart Gesture Handling**: The screen will only start the dismissal process when:
- `vertical`: ScrollView is at the top (scrollY <= 0)
- `vertical-inverted`: ScrollView is at the bottom (scrollY >= maxScroll)
- `horizontal`: ScrollView is at the left edge
- `horizontal-inverted`: ScrollView is at the right edge

This prevents gesture conflicts and provides intuitive user interaction.

## Performance Considerations

This package is designed for optimal performance, but since underlying screens remain active during transitions, following these guidelines will help maintain smooth 60fps animations:

### Screen Optimization
- **Keep screens lightweight**: Minimize heavy computations and complex layouts in screens that will be animated

### Animation Properties
Prioritize transform and opacity properties over layout-affecting properties for the smoothest animations:

**✅ Performant properties:**
- `transform` (translateX, translateY, scale, rotate)
- `opacity`
- `backgroundColor` (with caution)

**❌ Avoid when possible:**
- Layout properties (`width`, `height`, `padding`, `margin`)
- `borderRadius` on large elements
- Complex `shadowOffset` or `elevation` changes
- Frequent `zIndex` modifications

### Easing and Timing Configuration

Choose balanced easing curves to avoid perceived delays:

```tsx
// ✅ Good - Smooth and responsive
transitionSpec: {
  open: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1), // iOS-like easing
  },
  close: {
    duration: 250,
    easing: Easing.out(Easing.quad),
  },
}

// ❌ Avoid - Too snappy, may cause perceived delays
transitionSpec: {
  close: {
    duration: 400,
    easing: Easing.bezierFn(0, 0.98, 0, 1), // Too abrupt
  },
}
```

**Why timing matters**: Screen dismissal callbacks execute when animations complete. Overly snappy configurations can create a perceived delay between gesture end and actual screen dismissal. Find the sweet spot that matches your app's personality while feeling responsive.


## Support and Development

This package is provided as-is and is developed in my free time. While I strive to maintain and improve it, please understand that:

- **Updates and bug fixes** may take time to implement
- **Feature requests** will be considered but may not be prioritized immediately

I apologize for any inconvenience this may cause. If you encounter issues or have suggestions, please feel free to open an issue on the repository.



## License
MIT
