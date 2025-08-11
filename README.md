# react-native-screen-transitions


| iOS | Android |
|---|---|
| <video src="https://github.com/user-attachments/assets/c0d17b8f-7268-421c-9051-e242f8ddca76" width="300" height="600" controls></video> | <video src="https://github.com/user-attachments/assets/3f8d5fb1-96d2-4fe3-860d-62f6fb5a687e" width="300" controls></video> |


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
npm install react-native-reanimated react-native-gesture-handler \
  @react-navigation/native @react-navigation/native-stack \
  @react-navigation/elements react-native-screens \
  react-native-safe-area-context
```

## Setup

### 1. Expo Router

```tsx
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import {
  createNativeStackNavigator,
  type NativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
} from "react-native-screen-transitions";

const { Navigator } = createNativeStackNavigator();

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(Navigator);
```

That’s it — you’re ready to go.

### 2. React Navigation (bare)

If you’re using **React Navigation** directly (not Expo Router), the navigator is already configured.
No extra setup is required—just import and use as usual:

```tsx
import { createNativeStackNavigator } from 'react-native-screen-transitions';

const Stack = createNativeStackNavigator();

// Use Stack.Navigator and Stack.Screen as normal
```

### Extended native-stack options

This package ships an **extended native stack** built on top of React Navigation’s native stack.
All the usual native-stack options are available, plus the following extras:

| Option | Type | Description |
|---|---|---|
| `enableTransitions` | `boolean` | Switches the screen to a transparent modal and disables the header so custom transitions can take over. |
| `screenStyleInterpolator` | `ScreenStyleInterpolator` | Function that returns animated styles based on transition progress. |
| `transitionSpec` | `TransitionSpec` | Reanimated timing/spring config for open/close animations. |
| `gestureEnabled` | `boolean` | Whether swipe-to-dismiss is allowed. |
| `gestureDirection` | `GestureDirection \| GestureDirection[]` | Allowed swipe directions (`vertical`, `horizontal`, etc.). |
| `gestureVelocityImpact` | `number` | How much the gesture’s velocity affects dismissal. |
| `gestureResponseDistance` | `number` | Distance from screen where the gesture is recognized. |
| `gestureDrivesProgress` | `boolean` | Whether the gesture directly drives the transition progress. |

### Renamed native options (extended stack)

To avoid collisions with the new options above, the built-in React Navigation gesture props are renamed:

| React Navigation prop | Renamed to |
|---|---|
| `gestureDirection` | `nativeGestureDirection` |
| `gestureEnabled` | `nativeGestureEnabled` |
| `gestureResponseDistance` | `nativeGestureResponseDistance` |

All other React Navigation native-stack options keep their original names.


## Creating your screen animations

### Using presets

Pick a built-in preset and spread it into the screen’s options.
The incoming screen automatically controls the previous screen.

```tsx
<Stack>
  <Stack.Screen
    name="a"
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

### Navigator-level custom animations

Instead of presets, you can define a custom transition directly on the screen’s options.
`screenStyleInterpolator` receives an object with the following useful fields:

- `progress` – overall transition progress (`0 → 2`).
- `current` – state for the current screen (includes `progress`, `closing`, `gesture`, `route`, etc.).
- `previous` – state for the previous screen (may be `undefined`).
- `next` – state for the next screen (may be `undefined`).
- `layouts.screen` – `{ width, height }` of the container.
- `insets` – `{ top, right, bottom, left }` safe-area insets.
- `bounds(id)` – helper to compute shared-element transforms (see IntelliSense for chainable methods).
- `activeBoundId`	– id of the active bound.
- `focused` – state of the current screen


```tsx
import { interpolate } from 'react-native-reanimated'

<Stack.Screen
  name="b"
  options={{
    enableTransitions: true,
    screenStyleInterpolator: ({
      layouts: { screen: { width } },
      progress,
    }) => {
      "worklet";

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
  const props = useScreenAnimation();

  const animatedStyle = useAnimatedStyle(() => {
    const { current: { progress } } = props.value
    return {
      opacity: progress
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {/* Your content */}
    </Animated.View>
  );
}
```

## Swipe-to-dismiss with scrollables

You can drag a screen away even when it contains a scroll view.
Just swap the regular scrollable for a transition-aware one:

```tsx
import Transition from 'react-native-screen-transitions';
import { LegendList } from "@legendapp/list"
import { FlashList } from "@shopify/flash-list";

// Drop-in replacements
const ScrollView = Transition.ScrollView;
const FlatList = Transition.FlatList;

// Or wrap any list you like
const TransitionFlashList =
  Transition.createTransitionAwareScrollable(FlashList, { isScrollable: true });

const TransitionLegendList =
  Transition.createTransitionAwareScrollable(LegendList, { isScrollable: true} );
```

Enable the gesture on the screen:

```tsx
<Stack.Screen
  name="gallery"
  options={{
    enableTransitions: true,
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

These rules apply **only when the screen contains a scrollable**.
If no scroll view is present, the gesture can begin from **anywhere on the screen**—not restricted to the edges.

## Bounds (measure-driven screen transitions)

Bounds let you animate **any component** between two screens by measuring its start and end positions.
They are **not shared elements**—they’re just measurements.
Tag the component you want to animate with `sharedBoundTag`, then describe how it should move when the screen transition starts.

1. Tag the source component

```tsx
<Transition.View sharedBoundTag="hero" style={{ width: 100, height: 100 }}>
  <Image source={uri} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
</Transition.View>
```

2. Tag the destination component (same id)

```tsx
<Transition.View sharedBoundTag="hero" style={{ width: 200, height: 200 }}>
  <Image source={uri} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
</Transition.View>
```

3. Drive the animation in `screenStyleInterpolator`

```tsx
screenStyleInterpolator: ({
  activeBoundId,
  bounds,
  focused,
  current,
  next,
}) => {
  "worklet";

  const animatedBoundStyles = bounds()
    .relative()
    .transform()
    .build();

  return {
    [activeBoundId]: animatedBoundStyles,
  };
};
```

That’s it—the bounds helper works alongside focused and unfocused screens.
For further customization, separate logic by the `focused` prop:

```tsx
screenStyleInterpolator: ({
  activeBoundId,
  bounds,
  focused,
  current,
  next,
}) => {
  "worklet";


  if (focused) {
    const focusedBoundStyles = bounds()
      .relative()
      .transform()
      .build();

    return {
      [activeBoundId]: focusedBoundStyles,
    };
  }

  return {}
};
```


### Choosing the right modifier

| Modifier | When to use |
|---|---|
| `gestures({x,y})` | Sync the bound with live gesture deltas (drag, swipe). |
| `toFullscreen()` | Destination has no `sharedBoundTag`; animate to full-screen size. |
| `absolute()` | Element is not constrained by parent layout (uses pageX/pageY). |
| `relative()` | Element is inside layout constraints (default). |
| `transform()` | Animate with `translateX/Y` + `scaleX/Y` (default). |
| `size()` | Animate `translateX/Y` + `width/height` (no scale). |
| `content()` | Center the container so its bound aligns with the source at progress start. |
| `contentFill()` / `contentFit()` | Control how the content scales inside the container. |
| `build()` | Finalize the animated style object. |

### Quick access: `bounds.get()`

Need the raw measurements or styles for a specific bound?
Call `bounds.get(boundId, phase)` to retrieve the exact dimensions and style object for any bound tag and screen phase (`current`, `next`, or `previous`).

```tsx
const heroMetrics = bounds.get('hero', 'current');
// heroMetrics = { bounds: { x, y, width, height, pageX, pageY }, styles: { ... } }
```

Use this when you want explicit control over which bound’s data you animate, regardless of the current screen focus.

## Animating individual components with `styleId`

Use `styleId` to animate a single view inside a screen.

1. Tag the element:

```tsx
<Transition.View styleId="fade-box" style={{ width: 100, height: 100, backgroundColor: 'crimson' }} />
```

2. Drive it from the interpolator:

```tsx
screenStyleInterpolator: ({ progress }) => {
  "worklet";

  return {
    'fade-box': {
      opacity: interpolate(progress, [0, 1, 2],[0, 1, 0])
    }
  };
};
```

The red square fades in as the screen opens.

## Known Issues

- **Delayed Touch Events** – There’s a noticeable delay in touch events, likely caused by the `beforeRemove` listener in the native stack. If this affects your app, please hold off on using this package until a fix is available.
- **Deeply nested navigators with scrollables** – Behavior is currently unstable. We recommend using programmatic dismissal for deeply nested navigators that contain scrollables, as the gesture-driven dismissal logic needs an overhaul.


## Support and Development

This package is provided as-is and is developed in my free time. While I strive to maintain and improve it, please understand that:

- **Updates and bug fixes** may take time to implement
- **Feature requests** will be considered but may not be prioritized immediately

I apologize for any inconvenience this may cause. If you encounter issues or have suggestions, please feel free to open an issue on the repository.

### Support the project
I’ve estimated I downed around 60 cups of coffee while building this.
If you’d like to fuel the next release, [buy me a coffee](https://buymeacoffee.com/trpfsu)



## License
MIT
