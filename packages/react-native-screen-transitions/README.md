# react-native-screen-transitions

Customizable screen transitions for React Native. Build gesture-driven, shared element, and fully custom animations with a simple API.

| iOS                                                                                                                                     | Android                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| <video src="https://github.com/user-attachments/assets/c0d17b8f-7268-421c-9051-e242f8ddca76" width="300" height="600" controls></video> | <video src="https://github.com/user-attachments/assets/3f8d5fb1-96d2-4fe3-860d-62f6fb5a687e" width="300" controls></video> |

## Features

- **Full Animation Control** – Define exactly how screens enter, exit, and respond to gestures
- **Shared Elements** – Smooth transitions between screens using the Bounds API
- **Gesture Support** – Swipe-to-dismiss with edge or full-screen activation
- **Stack Progress** – Track animation progress across the entire stack
- **Ready-Made Presets** – Instagram, Apple Music, X (Twitter) style transitions included

## When to Use This Library

| Use Case | This Library | Alternative |
|----------|--------------|-------------|
| Custom transitions (slide, zoom, fade variations) | Yes | `@react-navigation/stack` works too |
| Shared element transitions | **Yes** | Limited options elsewhere |
| Multi-stop sheets (bottom, top, side) with snap points | **Yes** | Dedicated sheet libraries |
| Gesture-driven animations (drag to dismiss, elastic) | **Yes** | Requires custom implementation |
| Instagram/Apple Music/Twitter-style transitions | **Yes** | Custom implementation |
| Simple push/pop with platform defaults | Overkill | `@react-navigation/native-stack` |
| Maximum raw performance on low-end devices | Not ideal | `@react-navigation/native-stack` |

**Choose this library when** you need custom animations, shared elements, or gesture-driven transitions that go beyond platform defaults.

**Choose native-stack when** you want platform-native transitions with zero configuration and maximum performance on low-end Android devices.

## Installation

```bash
npm install react-native-screen-transitions
```

### Peer Dependencies

```bash
npm install react-native-reanimated react-native-gesture-handler \
  @react-navigation/native @react-navigation/native-stack \
  @react-navigation/elements react-native-screens \
  react-native-safe-area-context
```

---

## Quick Start

### 1. Create a Stack

```tsx
import { createBlankStackNavigator } from "react-native-screen-transitions/blank-stack";
import Transition from "react-native-screen-transitions";

const Stack = createBlankStackNavigator();

function App() {
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

### 2. With Expo Router

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

---

## Presets

Use built-in presets for common transitions:

```tsx
<Stack.Screen
  name="Detail"
  options={{
    ...Transition.Presets.SlideFromBottom(),
  }}
/>
```

| Preset                                 | Description                             |
| -------------------------------------- | --------------------------------------- |
| `SlideFromTop()`                       | Slides in from top                      |
| `SlideFromBottom()`                    | Slides in from bottom (modal-style)     |
| `ZoomIn()`                             | Scales in with fade                     |
| `DraggableCard()`                      | Multi-directional drag with scaling     |
| `ElasticCard()`                        | Elastic drag with overlay               |
| `SharedIGImage({ sharedBoundTag })`    | Instagram-style shared image            |
| `SharedAppleMusic({ sharedBoundTag })` | Apple Music-style shared element        |
| `SharedXImage({ sharedBoundTag })`     | X (Twitter)-style image transition      |

---

## Custom Animations

### The Basics

Every screen has a `progress` value that goes from 0 → 1 → 2:

```
0 ─────────── 1 ─────────── 2
entering     visible      exiting
```

When navigating from A to B:
- **Screen B**: progress goes `0 → 1` (entering)
- **Screen A**: progress goes `1 → 2` (exiting)

### Simple Fade

```tsx
options={{
  screenStyleInterpolator: ({ progress }) => {
    "worklet";
    return {
      contentStyle: {
        opacity: interpolate(progress, [0, 1, 2], [0, 1, 0]),
      },
    };
  },
}}
```

### Slide from Right

```tsx
options={{
  screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
    "worklet";
    return {
      contentStyle: {
        transform: [{
          translateX: interpolate(
            progress,
            [0, 1, 2],
            [screen.width, 0, -screen.width * 0.3]
          ),
        }],
      },
    };
  },
}}
```

### Slide from Bottom

```tsx
options={{
  screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
    "worklet";
    return {
      contentStyle: {
        transform: [{
          translateY: interpolate(progress, [0, 1], [screen.height, 0]),
        }],
      },
    };
  },
}}
```

### Return Styles

Your interpolator can return:

```tsx
return {
  contentStyle: { ... },   // Main screen
  backdropStyle: { ... },  // Semi-transparent backdrop
  ["my-id"]: { ... },      // Specific element via styleId
};
```

### Animation Specs

Control timing with spring configs:

```tsx
options={{
  screenStyleInterpolator: myInterpolator,
  transitionSpec: {
    open: { stiffness: 1000, damping: 500, mass: 3 },    // Screen enters
    close: { stiffness: 1000, damping: 500, mass: 3 },   // Screen exits
    expand: { stiffness: 300, damping: 30 },             // Snap point increases
    collapse: { stiffness: 300, damping: 30 },           // Snap point decreases
  },
}}
```

---

## Gestures

Enable swipe-to-dismiss:

```tsx
options={{
  gestureEnabled: true,
  gestureDirection: "vertical",
  ...Transition.Presets.SlideFromBottom(),
}}
```

### Gesture Options

| Option                    | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `gestureEnabled`          | Enable swipe-to-dismiss (snap sheets: `false` blocks dismiss-to-0 only) |
| `gestureDirection`        | Direction(s) for swipe gesture                                           |
| `gestureActivationArea`   | Where gesture can start                                                  |
| `gestureResponseDistance` | Pixel threshold for activation                                           |
| `gestureVelocityImpact`   | How much velocity affects dismissal (default: 0.3)                       |
| `gestureDrivesProgress`   | Whether gesture controls animation progress (default: true)              |
| `snapVelocityImpact`      | How much velocity affects snap targeting (default: 0.1, lower = iOS-like)|
| `expandViaScrollView`     | Allow expansion from ScrollView at boundary (default: true)               |
| `gestureSnapLocked`       | Lock gesture-based snap movement to current snap point                   |
| `backdropBehavior`        | Touch handling for backdrop area                                         |
| `backdropComponent`       | Custom backdrop component (replaces default backdrop + press behavior)   |

### Gesture Direction

```tsx
gestureDirection: "horizontal"          // swipe left to dismiss
gestureDirection: "horizontal-inverted" // swipe right to dismiss
gestureDirection: "vertical"            // swipe down to dismiss
gestureDirection: "vertical-inverted"   // swipe up to dismiss
gestureDirection: "bidirectional"       // any direction

// Or combine multiple:
gestureDirection: ["horizontal", "vertical"]
```

### Gesture Activation Area

```tsx
// Simple - same for all edges
gestureActivationArea: "edge"    // only from screen edges
gestureActivationArea: "screen"  // anywhere on screen

// Per-side configuration
gestureActivationArea: {
  left: "edge",
  right: "screen",
  top: "edge",
  bottom: "screen",
}
```

### With ScrollViews

Use transition-aware scrollables so gestures work correctly:

```tsx
<Transition.ScrollView>
  {/* content */}
</Transition.ScrollView>

<Transition.FlatList data={items} renderItem={...} />
```

Gesture rules with scrollables:
- **vertical** – only activates when scrolled to top
- **vertical-inverted** – only activates when scrolled to bottom
- **horizontal** – only activates at left/right scroll edges

---

## Snap Points

Create multi-stop sheets that snap to defined positions. Works with any gesture direction (bottom sheets, top sheets, side sheets):

### Basic Configuration

```tsx
// Bottom sheet (most common)
<Stack.Screen
  name="Sheet"
  options={{
    gestureEnabled: true,
    gestureDirection: "vertical",
    snapPoints: [0.5, 1],         // 50% and 100% of screen
    initialSnapIndex: 0,          // Start at 50%
    backdropBehavior: "dismiss",  // Tap backdrop to dismiss
    ...Transition.Presets.SlideFromBottom(),
  }}
/>

// Side sheet (same API, different direction)
<Stack.Screen
  name="SidePanel"
  options={{
    gestureEnabled: true,
    gestureDirection: "horizontal",
    snapPoints: [0.3, 0.7, 1],    // 30%, 70%, 100% of screen width
    initialSnapIndex: 1,
    // Add a horizontal screenStyleInterpolator for drawer-style motion
  }}
/>
```

### Options

| Option             | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `snapPoints`       | Array of fractions (0-1) where sheet can rest                        |
| `initialSnapIndex` | Index of initial snap point (default: 0)                             |
| `gestureSnapLocked` | Locks gesture snapping to current point (programmatic `snapTo` still works) |
| `backdropBehavior` | Touch handling: `"block"`, `"passthrough"`, `"dismiss"`, `"collapse"`|
| `backdropComponent` | Custom backdrop component; replaces default backdrop + tap handling    |

#### backdropBehavior Values

| Value           | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `"block"`       | Backdrop catches all touches (default)                           |
| `"passthrough"` | Touches pass through to content behind                           |
| `"dismiss"`     | Tapping backdrop dismisses the screen                            |
| `"collapse"`    | Tapping backdrop collapses to next lower snap point, then dismisses |

#### Custom Backdrop Component

Use `backdropComponent` when you want full control over backdrop visuals and interactions.

- When provided, it replaces the default backdrop entirely (including default tap behavior)
- You are responsible for dismiss/collapse actions inside the custom component
- `backdropBehavior` still controls container-level pointer event behavior

```tsx
import { router } from "expo-router";
import { Pressable } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";

function SheetBackdrop() {
  const animation = useScreenAnimation();

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value.current.progress, [0, 1], [0, 0.4]),
    backgroundColor: "#000",
  }));

  return (
    <Pressable style={{ flex: 1 }} onPress={() => router.back()}>
      <Animated.View style={[{ flex: 1 }, style]} />
    </Pressable>
  );
}

<Stack.Screen
  name="Sheet"
  options={{
    snapPoints: [0.5, 1],
    backdropBehavior: "dismiss",
    backdropComponent: SheetBackdrop,
  }}
/>
```

### Programmatic Control

Control snap points from anywhere in your app:

```tsx
import { snapTo } from "react-native-screen-transitions";

function BottomSheet() {
  // Expand to full height (index 1)
  const expand = () => snapTo(1);

  // Collapse to half height (index 0)
  const collapse = () => snapTo(0);

  return (
    <View>
      <Button title="Expand" onPress={expand} />
      <Button title="Collapse" onPress={collapse} />
    </View>
  );
}
```

The animated `snapIndex` is available in screen interpolators via `ScreenInterpolationProps`:

```tsx
screenStyleInterpolator: ({ snapIndex }) => {
  // snapIndex interpolates between snap point indices
  // e.g., 0.5 means halfway between snap point 0 and 1
  return {
    contentStyle: {
      opacity: interpolate(snapIndex, [0, 1], [0.5, 1]),
    },
  };
}
```

### ScrollView Behavior

With `Transition.ScrollView` inside a snap-enabled sheet:
- **`expandViaScrollView: true`**: At boundary, swipe up expands and swipe down collapses (or dismisses at min if enabled)
- **`expandViaScrollView: false`**: Expand works only via deadspace; collapse/dismiss via scroll still works at boundary
- **Scrolled into content**: Normal scroll behavior

### Snap Animation Specs

Customize snap animations separately from enter/exit:

```tsx
transitionSpec: {
  open: { stiffness: 1000, damping: 500, mass: 3 },   // Screen enter
  close: { stiffness: 1000, damping: 500, mass: 3 },  // Screen exit
  expand: { stiffness: 300, damping: 30 },            // Snap up
  collapse: { stiffness: 300, damping: 30 },          // Snap down
}
```

---

## Shared Elements (Bounds API)

Animate elements between screens by tagging them.

### 1. Tag the Source

```tsx
<Transition.Pressable
  sharedBoundTag="avatar"
  onPress={() => navigation.navigate("Profile")}
>
  <Image source={avatar} style={{ width: 50, height: 50 }} />
</Transition.Pressable>
```

### 2. Tag the Destination

```tsx
<Transition.View sharedBoundTag="avatar">
  <Image source={avatar} style={{ width: 200, height: 200 }} />
</Transition.View>
```

### 3. Use in Interpolator

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";
  return {
    avatar: bounds({ id: "avatar", method: "transform" }),
  };
};
```

### Bounds Options

| Option      | Values                             | Description                   |
| ----------- | ---------------------------------- | ----------------------------- |
| `id`        | string                             | The `sharedBoundTag` to match |
| `method`    | `"transform"` `"size"` `"content"` | How to animate                |
| `space`     | `"relative"` `"absolute"`          | Coordinate space              |
| `scaleMode` | `"match"` `"none"` `"uniform"`     | Aspect ratio handling         |
| `raw`       | boolean                            | Return raw values             |

---

## Overlays

Persistent UI that animates with the stack:

```tsx
const TabBar = ({ focusedIndex, progress }) => {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [100, 0]) }],
  }));
  return <Animated.View style={[styles.tabBar, style]} />;
};

<Stack.Screen
  name="Home"
  options={{
    overlay: TabBar,
    overlayShown: true,
  }}
/>
```

### Overlay Props

| Prop           | Description                    |
| -------------- | ------------------------------ |
| `focusedRoute` | Currently focused route        |
| `focusedIndex` | Index of focused screen        |
| `routes`       | All routes in the stack        |
| `progress`     | Stack progress (derived value) |
| `navigation`   | Navigation prop                |
| `meta`         | Custom metadata from options   |

---

## Transition Components

| Component               | Description                            |
| ----------------------- | -------------------------------------- |
| `Transition.View`       | Animated view with `sharedBoundTag`    |
| `Transition.Pressable`  | Pressable that measures bounds         |
| `Transition.ScrollView` | ScrollView with gesture coordination   |
| `Transition.FlatList`   | FlatList with gesture coordination     |
| `Transition.MaskedView` | For reveal effects (requires native)   |

---

## Hooks

### useScreenAnimation

Access animation state inside a screen:

```tsx
import { useScreenAnimation } from "react-native-screen-transitions";

function DetailScreen() {
  const animation = useScreenAnimation();

  const style = useAnimatedStyle(() => ({
    opacity: animation.value.current.progress,
  }));

  return <Animated.View style={style}>...</Animated.View>;
}
```

### useScreenState

Get navigation state without animation values:

```tsx
import { useScreenState } from "react-native-screen-transitions";

function DetailScreen() {
  const { index, focusedRoute, routes, navigation } = useScreenState();
  // ...
}
```

### useHistory

Access navigation history across the app:

```tsx
import { useHistory } from "react-native-screen-transitions";

function MyComponent() {
  const { getRecent, getPath } = useHistory();

  const recentScreens = getRecent(5);  // Last 5 screens
  const path = getPath(fromKey, toKey); // Path between screens
}
```

### useScreenGesture

Coordinate your own pan gestures with the navigation gesture:

```tsx
import { useScreenGesture } from "react-native-screen-transitions";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

function MyScreen() {
  const screenGesture = useScreenGesture();

  const myPanGesture = Gesture.Pan()
    .simultaneousWithExternalGesture(screenGesture)
    .onUpdate((e) => {
      // Your gesture logic
    });

  return (
    <GestureDetector gesture={myPanGesture}>
      <View />
    </GestureDetector>
  );
}
```

Use this when you have custom pan gestures that need to work alongside screen dismiss gestures.

---

## Advanced Animation Props

The full `screenStyleInterpolator` receives these props:

| Prop             | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `progress`       | Combined progress (0-2)                                  |
| `stackProgress`  | Accumulated progress across entire stack                 |
| `snapIndex`      | Animated snap point index (-1 if no snap points)         |
| `focused`        | Whether this screen is the topmost in the stack          |
| `current`        | Current screen state                                     |
| `previous`       | Previous screen state                                    |
| `next`           | Next screen state                                        |
| `active`         | Screen driving the transition                            |
| `inactive`       | Screen NOT driving the transition                        |
| `layouts.screen` | Screen dimensions                                        |
| `insets`         | Safe area insets                                         |
| `bounds`         | Shared element bounds function                           |

### Screen State Properties

Each screen state (`current`, `previous`, `next`, `active`, `inactive`) contains:

| Property    | Description                              |
| ----------- | ---------------------------------------- |
| `progress`  | Animation progress (0 or 1)              |
| `closing`   | Whether closing (0 or 1)                 |
| `entering`  | Whether entering (0 or 1)                |
| `animating` | Whether animating (0 or 1)               |
| `gesture`   | Gesture values (x, y, normalized values) |
| `meta`      | Custom metadata from options             |

### Using `meta` for Conditional Logic

Pass custom data between screens:

```tsx
// Screen A
options={{ meta: { hideTabBar: true } }}

// Screen B reads it
screenStyleInterpolator: (props) => {
  "worklet";
  const hideTabBar = props.inactive?.meta?.hideTabBar;
  // ...
};
```

### Animate Individual Elements

Use `styleId` to target specific elements:

```tsx
// In options
screenStyleInterpolator: ({ progress }) => {
  "worklet";
  return {
    "hero-image": {
      opacity: interpolate(progress, [0, 1], [0, 1]),
    },
  };
};

// In component
<Transition.View styleId="hero-image">
  <Image source={...} />
</Transition.View>
```

---

## Stack Types

All three stacks share the same animation API. Choose based on your needs:

| Stack               | Best For                                                  |
| ------------------- | --------------------------------------------------------- |
| **Blank Stack**     | Most apps. Full control, all features.                    |
| **Native Stack**    | When you need native screen primitives.                   |
| **Component Stack** | Embedded flows, isolated from React Navigation. *(Experimental)* |

### Blank Stack

The default choice. Uses `react-native-screens` for native screen containers, with animations powered by Reanimated worklets running on the UI thread (not the JS thread).

```tsx
import { createBlankStackNavigator } from "react-native-screen-transitions/blank-stack";
```

### Native Stack

Extends `@react-navigation/native-stack`. Requires `enableTransitions: true`.

```tsx
import { createNativeStackNavigator } from "react-native-screen-transitions/native-stack";

<Stack.Screen
  name="Detail"
  options={{
    enableTransitions: true,
    ...Transition.Presets.SlideFromBottom(),
  }}
/>
```

### Component Stack (Experimental)

> **Note:** This API is experimental and may change based on community feedback.

Standalone navigator, not connected to React Navigation. Ideal for embedded flows.

```tsx
import { createComponentStackNavigator } from "react-native-screen-transitions/component-stack";

const Stack = createComponentStackNavigator();

<Stack.Navigator initialRouteName="step1">
  <Stack.Screen name="step1" component={Step1} />
  <Stack.Screen name="step2" component={Step2} />
</Stack.Navigator>
```

---

## Caveats & Trade-offs

### Native Stack

The Native Stack uses transparent modal presentation to intercept transitions. This has trade-offs:

- **Delayed touch events** – Exiting screens may have briefly delayed touch response
- **beforeRemove listeners** – Relies on navigation lifecycle events
- **Rapid navigation** – Some edge cases with very fast navigation sequences

For most apps, Blank Stack avoids these issues entirely.

### Component Stack (Experimental)

- **No deep linking** – Routes aren't part of your URL structure
- **Isolated state** – Doesn't affect parent navigation
- **Touch pass-through** – Uses `pointerEvents="box-none"` by default

---

## Experimental Features

### High Refresh Rate

Force maximum refresh rate during transitions (for 90Hz/120Hz displays):

```tsx
options={{
  experimental_enableHighRefreshRate: true,
}}
```

---

## Masked View Setup

Required for `SharedIGImage` and `SharedAppleMusic` presets. The masked view creates the "reveal" effect where content expands from the shared element.

> **Note**: Requires native code. Will not work in Expo Go.

### Installation

```bash
# Expo
npx expo install @react-native-masked-view/masked-view

# Bare React Native
npm install @react-native-masked-view/masked-view
cd ios && pod install
```

### Full Example

**1. Source Screen** – Tag pressable elements:

```tsx
// app/index.tsx
import { router } from "expo-router";
import { View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Transition.Pressable
        sharedBoundTag="album-art"
        style={{
          width: 200,
          height: 200,
          backgroundColor: "#1DB954",
          borderRadius: 12,
        }}
        onPress={() => {
          router.push({
            pathname: "/details",
            params: { sharedBoundTag: "album-art" },
          });
        }}
      />
    </View>
  );
}
```

**2. Destination Screen** – Wrap with MaskedView and match the tag:

```tsx
// app/details.tsx
import { useLocalSearchParams } from "expo-router";
import Transition from "react-native-screen-transitions";

export default function DetailsScreen() {
  const { sharedBoundTag } = useLocalSearchParams<{ sharedBoundTag: string }>();

  return (
    <Transition.MaskedView style={{ flex: 1, backgroundColor: "#121212" }}>
      <Transition.View
        sharedBoundTag={sharedBoundTag}
        style={{
          backgroundColor: "#1DB954",
          width: 400,
          height: 400,
          alignSelf: "center",
          borderRadius: 12,
        }}
      />
      {/* Additional screen content */}
    </Transition.MaskedView>
  );
}
```

**3. Layout** – Apply the preset with dynamic tag:

```tsx
// app/_layout.tsx
import Transition from "react-native-screen-transitions";
import { Stack } from "./stack";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="details"
        options={({ route }) => ({
          ...Transition.Presets.SharedAppleMusic({
            sharedBoundTag: route.params?.sharedBoundTag ?? "",
          }),
        })}
      />
    </Stack>
  );
}
```

### How It Works

1. `Transition.Pressable` measures its bounds on press and stores them with the tag
2. `Transition.View` on the destination registers as the target for that tag
3. `Transition.MaskedView` clips content to the animating shared element bounds
4. The preset interpolates position, size, and mask for a seamless expand/collapse effect

---

## Support

This package is developed in my spare time.

If you'd like to fuel the next release, [buy me a coffee](https://buymeacoffee.com/trpfsu)

## License

MIT
