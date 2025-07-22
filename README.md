# react-native-screen-transitions


















| iOS | Android |
|---|---|
| <video src="https://github.com/user-attachments/assets/81f39391-80c0-4ce4-b6ff-76de85d2cf03" width="300" height="600" controls></video> | <video src="https://github.com/user-attachments/assets/c2b4c6ca-2b0c-4cf4-a164-f7e68cee0c32" width="300" controls></video> |


**WIP**: This package is a work-in-progress. It provides customizable screen transition animations for React Native apps, primarily designed for use with `expo-router` and `react-navigation`. It supports gestures, predefined presets, and custom animations, making it easy to add polished transitions to your navigation flows.

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
npm install react-native-reanimated react-native-gesture-handler @react-navigation/native-stack
```

## Setup

### 1. React Navigation
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Transition from 'react-native-screen-transitions';

const Stack = Transition.createTransitionableStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={Home}
            options={{
              skipDefaultScreenOptions: true, // prevents transparent-modal default
            }}
          />
          <Stack.Screen
            name="A"
            component={ScreenA}
            options={{
              ...Transition.presets.SlideFromTop(),
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
```

### 2. Expo Router
Use the withLayoutContext to convert it into an expo router compatible navigator.

```tsx
import { withLayoutContext } from 'expo-router';
import Transition, {
  type TransitionStackNavigatorTypeBag,
} from 'react-native-screen-transitions';

const TransitionableNativeStack =
  Transition.createTransitionableStackNavigator();

export const Stack = withLayoutContext<
  TransitionStackNavigatorTypeBag['ScreenOptions'],
  typeof TransitionableNativeStack.Navigator,
  TransitionStackNavigatorTypeBag['State'],
  TransitionStackNavigatorTypeBag['EventMap']
>(TransitionableNativeStack.Navigator);
```

Use it exactly like any other Expo Router layout:

```tsx
import { Stack } from './layouts/stack.tsx'

export default function RootLayout(){
  return(
    <GestureHandlerRootView>
      <Stack>
        <Stack.Screen
          name="a"
          options={{
            // You usually don't want your first screen to be a transparent modal.
            skipDefaultScreenOptions: true,
          }}
        />
        <Stack.Screen
          name="b"
          options={{
            ...Transition.presets.SlideFromTop(),
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  )
}
```

> **Note**: `Transition.createTransitionableStackNavigator()` returns a Native Stack Navigator that's been injected with the necessary functionality for screen transitions to work.


## Creating your screen animations

### Using presets

Pick a built-in preset and spread it into the screen’s options.
The incoming screen automatically controls the previous screen.

```tsx
<Stack>
  <Stack.Screen
    name="a"
    options={{
      // avoids transparent-modal default for first screen
      skipDefaultScreenOptions: true,
    }}
  />
  <Stack.Screen
    name="b"
    options={{
      ...Transition.presets.SlideFromTop(),
    }}
  />
  <Stack.Screen
    name="c"
    options={{
      ...Transition.presets.SlideFromBottom(),
    }}
  />
</Stack>
```

> ⚠️ **Important**
> Any screen that **must** participate in a transition (i.e., be animated) **must** be wrapped in a transition-aware component.
> For example, if both `a` and `b` are meant to animate, wrap each screen’s root like this:

```tsx
// a.tsx
<Transition.View>
  ...
</Transition.View>

// b.tsx
<Transition.View>
  ...
</Transition.View>
```

Without this wrapper, the transition system cannot animate the screen and the animation will appear broken or skipped.



### Navigator-level custom animations

Instead of presets, you can define a custom transition directly on the screen’s options.
The `screenStyleInterpolator` receives the current and next screen’s progress and lets you animate both at once.

```tsx
import { interpolate } from 'react-native-reanimated'
<Stack.Screen
  name="b"
  options={{
    screenStyleInterpolator: ({
      current,
      next,
      layouts: { screen: { width } },
    }) => {
      "worklet";

      const progress = current.progress.value + (next?.progress.value ?? 0);

      const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);
      return {
        contentStyle: {
          transform: [{ translateX: x }],
        },
      };
    },
    transitionSpec: {
      close: Transition.specs.DefaultSpec,
      open: Transition.specs.DefaultSpec,
    },
  }}
/>
```

In this example the incoming screen slides in from the right while the exiting screen slides out to the left.

### Screen-level custom animations with `useScreenAnimation`

For per-screen control, import the `useScreenAnimation` hook and compose your own animated styles.

```tsx
import { useScreenAnimation } from 'react-native-screen-transitions';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';

export default function BScreen() {
  const { current } = useScreenAnimation();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: current.progress.value
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {/* Your content */}
    </Animated.View>
  );
}
```

## Apply screen transitions to nested navigators

When a screen contains its own stack (e.g., `b` is a nested navigator), wrap the nested `Stack` in a `Transition.View`.

```tsx
// app/b/_layout.tsx  (nested stack for screen "b")
import { Stack } from 'expo-router';
import Transition from 'react-native-screen-transitions';

export default function BLayout() {
  return (
    <Transition.View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ headerShown: false }} />
      </Stack>
    </Transition.View>
  );
}
```

The outer transition now treats the entire nested stack as a single animatable view while each inner screen can still function normally—whether you keep the native stack or swap it for the Transitionable Stack.

## Swipe-to-dismiss with scrollables

You can drag a screen away even when it contains a scroll view.
Just swap the regular scrollable for a transition-aware one:

```tsx
import Transition from 'react-native-screen-transitions';
import { LegendList } from "@legendapp/list"
import { FlashList } from "@shopify/flash-list";

// Drop-in replacements
const ScrollView = Transition.ScrollView;
const FlatList   = Transition.FlatList;

// Or wrap any list you like
const TransitionFlashList =
  Transition.createTransitionAwareScrollable(FlashList);

const TransitionLegendList =
  Transition.createTransitionAwareScrollable(LegendList);
```

Enable the gesture on the screen:

```tsx
<Stack.Screen
  name="gallery"
  options={{
    gestureEnabled: true,
    gestureDirection: 'vertical', // or 'horizontal', ['vertical', 'horizontal'], etc.
  }}
/>
```

Use it in the screen:

```tsx
export default function B() {
  return (
    <Transition.ScrollView>
      {/* content */}
    </Transition.ScrollView>
  );
}
```

Gesture rules (handled automatically):

- **vertical** – only starts when the list is at the very top
- **vertical-inverted** – only starts when the list is at the very bottom
- **horizontal** / **horizontal-inverted** – only starts when the list is at the left or right edge

These rules apply **only when the screen contains a nested scrollable**.
If no scroll view is present, the gesture can begin from **anywhere on the screen**—not restricted to the edges.

## Performance tips

Keep animations smooth and responsive:

- **Optimize screen content** – avoid heavy computations, complex layouts, or expensive renders in screens that animate
- **Use GPU-friendly properties** – stick to `transform` and `opacity` which are hardware-accelerated; avoid animating `width`, `height`, `padding`, large `borderRadius`, and complex shadows
- **Choose appropriate timing** – use natural easing curves and durations that feel responsive without being jarring

## Roadmap

- **Shared element transitions** – seamless hand-off of components between screens
- **Gesture-driven forward navigation** – allow gestures to trigger push navigation events
- **Performance maximization** – further reduce JS thread work and leverage Reanimated 3’s new APIs for even smoother 60 fps animations


## Support and Development

This package is provided as-is and is developed in my free time. While I strive to maintain and improve it, please understand that:

- **Updates and bug fixes** may take time to implement
- **Feature requests** will be considered but may not be prioritized immediately

I apologize for any inconvenience this may cause. If you encounter issues or have suggestions, please feel free to open an issue on the repository.




## License
MIT
