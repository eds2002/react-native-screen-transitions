# react-native-screen-transitions

Customizable screen transitions for React Native. Build gesture-driven, shared element, and fully custom animations with a simple API.

| iOS                                                                                                                                     | Android                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| <video src="https://github.com/user-attachments/assets/c0d17b8f-7268-421c-9051-e242f8ddca76" width="300" height="600" controls></video> | <video src="https://github.com/user-attachments/assets/3f8d5fb1-96d2-4fe3-860d-62f6fb5a687e" width="300" controls></video> |

## Features

- **Full Animation Control** – Define exactly how screens enter, exit, and respond to gestures
- **Shared Elements** – Smooth transitions between screens using `Transition.Boundary` and the Bounds API
- **Navigation Bounds** – iOS-style zoom transitions with masked reveal effects via `bounds().navigation.zoom()`
- **Gesture Support** – Swipe-to-dismiss with edge or full-screen activation, configurable velocity
- **Animated Props** – Drive component-specific props (e.g., BlurView `intensity`) alongside styles
- **Custom Layers** – `backgroundComponent` and `backdropComponent` with animated styles and props
- **Stack Progress** – Track animation progress across the entire stack
- **Ready-Made Presets** – Instagram, Apple Music, X (Twitter), zoom navigation style transitions included

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
      content: {
        style: {
          opacity: interpolate(progress, [0, 1, 2], [0, 1, 0]),
        },
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
      content: {
        style: {
          transform: [{
            translateX: interpolate(
              progress,
              [0, 1, 2],
              [screen.width, 0, -screen.width * 0.3]
            ),
          }],
        },
      },
    };
  },
}}
```

### Slide from Bottom with Backdrop

```tsx
options={{
  screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
    "worklet";
    return {
      content: {
        style: {
          transform: [{
            translateY: interpolate(progress, [0, 1], [screen.height, 0]),
          }],
        },
      },
      backdrop: {
        style: {
          backgroundColor: "black",
          opacity: interpolate(progress, [0, 1], [0, 0.5]),
        },
      },
    };
  },
}}
```

### Return Format

Your interpolator returns a map of **slots**. Each slot can use shorthand styles or the explicit `{ style, props }` form:

```tsx
return {
  content: { ... },          // Main screen content
  backdrop: { ... },         // Backdrop layer between screens
  background: { ... },       // Background component layer
  ["my-id"]: { ... },        // Specific element via styleId
};
```

Each slot accepts two forms:

```tsx
// Shorthand — plain styles (auto-wrapped as { style: value })
content: {
  opacity: 0.5,
  transform: [{ scale: 0.9 }],
},

// Explicit — separate style and props buckets
content: {
  style: { opacity: 0.5, transform: [{ scale: 0.9 }] },
  props: { intensity: 80 },  // for useAnimatedProps (e.g., BlurView)
},
```

> **Legacy format**: The flat `contentStyle`/`backdropStyle` format is still supported but deprecated. It will be auto-converted with a one-time warning in development.

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

| Option                          | Description                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `gestureEnabled`                | Enable swipe-to-dismiss (snap sheets: `false` blocks dismiss-to-0 only) |
| `gestureDirection`              | Direction(s) for swipe gesture                                           |
| `gestureActivationArea`         | Where gesture can start                                                  |
| `gestureResponseDistance`       | Pixel threshold for activation                                           |
| `gestureVelocityImpact`        | How much velocity affects dismissal (default: 0.3)                       |
| `gestureDrivesProgress`        | Whether gesture controls animation progress (default: true)              |
| `snapVelocityImpact`           | How much velocity affects snap targeting (default: 0.1, lower = iOS-like)|
| `gestureReleaseVelocityScale`  | Multiplier for post-release spring velocity (default: 1)                 |
| `gestureReleaseVelocityMax`    | Cap on post-release spring velocity (default: 3.2)                       |
| `expandViaScrollView`          | Allow expansion from ScrollView at boundary (default: true)              |
| `gestureSnapLocked`            | Lock gesture-based snap movement to current snap point                   |
| `backdropBehavior`             | Touch handling for backdrop area                                         |
| `backdropComponent`            | Custom backdrop component, driven by interpolator `backdrop` slot        |
| `backgroundComponent`          | Custom background component, driven by interpolator `background` slot    |
| `maskEnabled`                  | Pre-mount masked view wrapper for navigation bounds masking              |

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
| `backdropComponent` | Custom backdrop component, driven by interpolator `backdrop` slot     |

#### backdropBehavior Values

| Value           | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `"block"`       | Backdrop catches all touches (default)                           |
| `"passthrough"` | Touches pass through to content behind                           |
| `"dismiss"`     | Tapping backdrop dismisses the screen                            |
| `"collapse"`    | Tapping backdrop collapses to next lower snap point, then dismisses |

#### Custom Backdrop Component

Use `backdropComponent` to provide a custom component for the backdrop layer between screens (e.g., a `BlurView`).

- The library wraps your component with `Animated.createAnimatedComponent` internally
- Animated styles and props are driven by the `backdrop` slot in your interpolator
- `backdropBehavior` still controls the wrapping `Pressable` for dismiss/collapse handling

```tsx
import { BlurView } from "expo-blur";

<Stack.Screen
  name="Sheet"
  options={{
    snapPoints: [0.5, 1],
    backdropBehavior: "dismiss",
    backdropComponent: BlurView,
    screenStyleInterpolator: ({ progress }) => {
      "worklet";
      return {
        backdrop: {
          style: { opacity: interpolate(progress, [0, 1], [0, 1]) },
          props: { intensity: interpolate(progress, [0, 1], [0, 80]) },
        },
        content: {
          style: {
            transform: [{ translateY: interpolate(progress, [0, 1], [800, 0]) }],
          },
        },
      };
    },
  }}
/>
```

The `props` bucket is applied via `useAnimatedProps`, letting you animate component-specific properties like `BlurView`'s `intensity` or `SquircleView`'s `cornerRadius`.

#### Custom Background Component

Use `backgroundComponent` to replace the screen's content wrapper with a custom component (e.g., a `SquircleView` for smooth rounded corners).

- Replaces the default `Animated.View` wrapper (does not nest inside it)
- Receives content styles + background styles merged
- Animated props are driven by the `background` slot in your interpolator

```tsx
import { SquircleView } from "react-native-figma-squircle";

<Stack.Screen
  name="Card"
  options={{
    backgroundComponent: SquircleView,
    screenStyleInterpolator: ({ progress }) => {
      "worklet";
      return {
        content: {
          style: {
            transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }],
          },
        },
        background: {
          props: { cornerRadius: 24, cornerSmoothing: 0.7 },
        },
      };
    },
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
    content: {
      style: {
        opacity: interpolate(snapIndex, [0, 1], [0.5, 1]),
      },
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

Animate elements between screens by tagging them. There are two approaches: `Transition.Boundary` for declarative shared element transitions, and `sharedBoundTag` on `Transition.View`/`Transition.Pressable` for inline usage.

### Transition.Boundary

The recommended way to set up shared elements. Automatically handles measurement, matching, and lifecycle:

```tsx
// Source screen — list item
<Transition.Boundary
  id="album-art"
  group="albums"           // Optional: for lists/collections
  role="source"            // Optional: explicit role
  onPress={() => router.push("/details")}
>
  <Image source={album} style={{ width: 100, height: 100 }} />
</Transition.Boundary>

// Destination screen
<Transition.Boundary id="album-art">
  <Image source={album} style={{ width: 300, height: 300 }} />
</Transition.Boundary>
```

#### Boundary Props

| Prop        | Description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| `id`        | Unique identifier for matching across screens                            |
| `group`     | Group name for collection/list scenarios (tag becomes `group:id`)        |
| `role`      | `"source"` or `"destination"` — auto-detected if omitted                 |
| `enabled`   | Whether this boundary participates in matching (default: true)           |
| `method`    | `"transform"` `"size"` `"content"` — how to animate                     |
| `anchor`    | Alignment anchor point                                                   |
| `scaleMode` | `"match"` `"none"` `"uniform"` — aspect ratio handling                   |
| `target`    | Target for size calculations (e.g., `"fullscreen"`)                      |

#### Groups

For list/collection scenarios where multiple items share the same transition:

```tsx
{items.map((item) => (
  <Transition.Boundary
    key={item.id}
    id={item.id}
    group="photos"
    onPress={() => router.push(`/photo/${item.id}`)}
  >
    <Image source={item.src} />
  </Transition.Boundary>
))}
```

Only the tapped item transitions. The library tracks which group member is active and handles re-measurement when focus changes.

### Inline Shared Elements

For simpler cases, use `sharedBoundTag` directly on `Transition.View` or `Transition.Pressable`:

```tsx
// Source
<Transition.Pressable
  sharedBoundTag="avatar"
  onPress={() => navigation.navigate("Profile")}
>
  <Image source={avatar} style={{ width: 50, height: 50 }} />
</Transition.Pressable>

// Destination
<Transition.View sharedBoundTag="avatar">
  <Image source={avatar} style={{ width: 200, height: 200 }} />
</Transition.View>
```

### Using Bounds in Interpolators

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";
  return {
    "avatar": bounds({ id: "avatar", method: "transform" }),
  };
};
```

### Navigation Bounds (Zoom Transitions)

For iOS-style zoom transitions where content expands from a source element with a masked reveal:

```tsx
<Stack.Screen
  name="Detail"
  options={{
    maskEnabled: true,  // Required for masked reveal
    screenStyleInterpolator: ({ bounds, progress, focused }) => {
      "worklet";
      if (!focused) return {};

      return bounds({ id: "album-art" }).navigation.zoom({
        scaleMode: "uniform",
      });
    },
    transitionSpec: {
      open: { stiffness: 1000, damping: 500, mass: 3, overshootClamping: true },
      close: { stiffness: 1000, damping: 500, mass: 3, overshootClamping: true },
    },
  }}
/>
```

`bounds().navigation.zoom()` returns a complete interpolator result with content, mask, and container styles. Set `maskEnabled: true` to pre-mount the masked view wrapper so it's ready from the first frame.

> **Note**: Navigation bounds masking requires `@react-native-masked-view/masked-view` to be installed.

### Bounds Options

| Option      | Values                             | Description                   |
| ----------- | ---------------------------------- | ----------------------------- |
| `id`        | string                             | The boundary id to match      |
| `method`    | `"transform"` `"size"` `"content"` | How to animate                |
| `space`     | `"relative"` `"absolute"`          | Coordinate space              |
| `scaleMode` | `"match"` `"none"` `"uniform"`     | Aspect ratio handling         |
| `anchor`    | string                             | Alignment anchor point        |
| `target`    | `"fullscreen"` etc.                | Target for size calculations  |
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

| Component               | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `Transition.Boundary`   | Declarative shared element with auto-matching and groups |
| `Transition.View`       | Animated view with `sharedBoundTag` or `styleId`         |
| `Transition.Pressable`  | Pressable that measures bounds on press                  |
| `Transition.ScrollView` | ScrollView with gesture coordination                     |
| `Transition.FlatList`   | FlatList with gesture coordination                       |
| `Transition.MaskedView` | For reveal effects (requires native)                     |

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
      style: {
        opacity: interpolate(progress, [0, 1], [0, 1]),
        transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }],
      },
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

Required for `SharedIGImage`, `SharedAppleMusic` presets, and `bounds().navigation.zoom()` transitions. The masked view creates the "reveal" effect where content expands from the shared element.

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

1. `Transition.Boundary` (or `Transition.Pressable`) measures its bounds and stores them with the tag
2. `Transition.Boundary` (or `Transition.View`) on the destination registers as the target for that tag
3. `Transition.MaskedView` (or `maskEnabled: true`) clips content to the animating shared element bounds
4. The preset interpolates position, size, and mask for a seamless expand/collapse effect

---

## Support

This package is developed in my spare time.

If you'd like to fuel the next release, [buy me a coffee](https://buymeacoffee.com/trpfsu)

## License

MIT
