# react-native-screen-transitions


| iOS | Android |
|---|---|
| <video src="https://github.com/user-attachments/assets/c0d17b8f-7268-421c-9051-e242f8ddca76" width="300" height="600" controls></video> | <video src="https://github.com/user-attachments/assets/3f8d5fb1-96d2-4fe3-860d-62f6fb5a687e" width="300" controls></video> |

## ✨ Features

- 🎯 **Reanimated v3-4 Compatible** – Built for the latest React Native Reanimated
- 📱 **Cross-Platform** – Supports iOS and Android (web not supported)
- 🔷 **TypeScript First** – Fully typed for better development experience
- 👆 **Advanced Gestures** – Powered by react-native-gesture-handler with edge and screen activation areas
- 🧭 **Navigation Ready** – Works seamlessly with expo-router and react-navigation
- 🔗 **Shared Elements** – Bounds API for measure-driven transitions between screens
- 🎭 **Ready-Made Presets** – Instagram, Apple Music, X (Twitter) style transitions included

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
| `gestureActivationArea` | `GestureActivationArea` | Where a gesture may start. `'edge' | 'screen'` or per-side `{ left|right|top|bottom: 'edge'|'screen' }`. |

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

#### Shared element presets (new)

Ready-made presets for common shared-element patterns. These leverage the bounds API under the hood. Tag your views with `sharedBoundTag` on both screens.

```tsx
<Stack.Screen name="feed" />
<Stack.Screen
  name="post"
  options={{
    ...Transition.presets.SharedIGImage(),
  }}
/>
```

Other presets: `SharedAppleMusic()`, `SharedXImage()`.

Note: Masked container required

- For `SharedIGImage` and `SharedAppleMusic`, wrap the next screen with `Transition.MaskedView` as the first element so the preset can animate `_ROOT_CONTAINER` and `_ROOT_MASKED` correctly.
- Install the mask package:
  - Expo: `npx expo install @react-native-masked-view/masked-view`
  - Bare RN: `npm i @react-native-masked-view/masked-view` (then iOS: `cd ios && pod install`)
- `Transition.MaskedView` lazy-loads the native mask and falls back to a plain `View` if missing, but the mask is required for the full shared effect.

Minimal usage on the destination screen:

```tsx
export default function PostScreen() {
  return (
    <Transition.MaskedView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* screen content, including the destination bound */}
    </Transition.MaskedView>
  );
}
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
- `bounds(options)` – compute shared-bound transforms/styles or raw values for a given bound. See "Bounds" below.
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
  Transition.createTransitionAwareComponent(FlashList, { isScrollable: true });

const TransitionLegendList =
  Transition.createTransitionAwareComponent(LegendList, { isScrollable: true} );
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

### Gesture activation area

Control where gestures can start using `gestureActivationArea` on the screen options:

```tsx
// Gesture must start from any screen edge (all sides)
gestureActivationArea: 'edge'

// Allow vertical drags anywhere, horizontal drags only from the left edge
gestureDirection: ['vertical', 'horizontal']
gestureActivationArea: { top: 'screen', left: 'edge' }
```

## Bounds (measure-driven screen transitions)

Bounds let you animate any component between two screens by measuring its start and end positions. They are not shared elements — just measurements.

**Current Implementation:** For bounds to be measured, a `Transition.Pressable` must have both an `onPress` handler and a `sharedBoundTag`. When pressed, it triggers measurement. If the `Transition.Pressable` has children with `sharedBoundTag`s, those children are automatically measured and stored as well.

*Note: This measurement trigger mechanism may change in future versions.*

1) Tag source and destination with pressable triggers

```tsx
// Source screen
<Transition.Pressable
  sharedBoundTag="hero"
  onPress={() => router.push('/detail')}
  style={{ width: 100, height: 100 }}
>
  <Image source={...} />
</Transition.Pressable>

// Destination screen
<Transition.Pressable
  sharedBoundTag="hero"
  onPress={() => {/* handle press */}}
  style={{ width: 200, height: 200 }}
>
  <Image source={...} />
</Transition.Pressable>
```

2) Children are automatically measured

```tsx
<Transition.Pressable
  sharedBoundTag="card"
  onPress={() => router.push('/detail')}
>
  {/* These children will be automatically measured when parent is pressed */}
  <Transition.View sharedBoundTag="title">
    <Text>Title</Text>
  </Transition.View>
  <Transition.View sharedBoundTag="subtitle">
    <Text>Subtitle</Text>
  </Transition.View>
</Transition.Pressable>
```

3) Drive the animation with the object API

```tsx
screenStyleInterpolator: ({ activeBoundId, bounds }) => {
  "worklet";

  const styles = bounds({
    method: "transform",      // "transform" | "size" | "content"
    space: "relative",        // "relative" | "absolute"
    scaleMode: "match",       // "match" | "none" | "uniform"
    anchor: "center",         // see anchors below
    // target: "bound" | "fullscreen" | { x, y, width, height, pageX, pageY }
    // gestures: { x?: number; y?: number }
  });

  return { [activeBoundId]: styles };
}
```

3) Raw values when you need them

```tsx
const raw = bounds({ method: "transform", raw: true });
// { translateX, translateY, scaleX, scaleY }
```

Or for size/content methods:

```tsx
const toSize = bounds({ method: "size", target: "fullscreen", space: "absolute", raw: true });
// { width, height, translateX, translateY }

const content = bounds({ method: "content", raw: true });
// { translateX, translateY, scale }
```

Anchors and scale

- `anchor`: "topLeading" | "top" | "topTrailing" | "leading" | "center" | "trailing" | "bottomLeading" | "bottom" | "bottomTrailing"
- `scaleMode`: "match" | "none" | "uniform"

Targets and space

- `target`: "bound" (default), "fullscreen", or explicit `{ x, y, width, height, pageX, pageY }`
- `space`: "relative" (within layout constraints) or "absolute" (window coordinates)

Gestures (sync focused screen deltas)

- `gestures`: `{ x?: number; y?: number }` adds live drag offsets to the computed transforms

Deprecated builder API

- The old chainable builder (`bounds().relative().transform().build()`) is deprecated. Migrate to the object form shown above. The builder remains temporarily for backward compatibility.

Quick access: `bounds.get()`

Use `bounds.get(id?, phase?)` to retrieve raw measurements and the resolved style for any bound in a given phase (`current`, `next`, `previous`).

```tsx
const { bounds: metrics, styles } = bounds.get('hero', 'current');
```

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

- **Delayed Touch Events** – There’s a noticeable delay in touch events when the transition is finished. If this affects your app, please hold off on using this package until a fix is available.


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
