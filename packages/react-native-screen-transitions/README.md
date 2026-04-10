# react-native-screen-transitions

Customizable screen transitions for React Native. Build gesture-driven, shared element, and fully custom animations with a simple API.

| iOS                                                                                                                                     | Android                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| <video src="https://github.com/user-attachments/assets/c0d17b8f-7268-421c-9051-e242f8ddca76" width="300" height="600" controls></video> | <video src="https://github.com/user-attachments/assets/3f8d5fb1-96d2-4fe3-860d-62f6fb5a687e" width="300" controls></video> |

## Features

- **Full Animation Control** – Define exactly how screens enter, exit, and respond to gestures
- **Bounds API + Navigation Zoom** – Build shared element and fullscreen zoom transitions with one bounds helper
- **Auto Snap Points** – Use `snapPoints: ["auto"]` and read measured content layout inside your interpolator
- **Gesture-Aware Scrollables** – Transition-aware `ScrollView` and `FlatList` coordinate with dismiss and snap gestures
- **Backdrop + Surface Slots** – Animate screen content, backdrops, surfaces, and per-element slots from one interpolator
- **Ready-Made Presets** – Instagram, Apple Music, X (Twitter) style transitions included

## What's New In 3.4

3.4 introduces a newer, more explicit path for shared transitions and snap-driven layouts.
Use the notes below as the source of truth when migrating examples or generating docs.

### Added / Expanded

- **Auto snap sizing** with `snapPoints: ["auto"]` and `current.layouts.content`
- **Scoped screen state access** through `previous`, `current`, `next`, `active`, and `inactive`, with `current.layouts` and `current.snapIndex`
- **Compound bounds components** via `Transition.Boundary.View`, `Transition.Boundary.Trigger`, and `Transition.Boundary.Target`
- **`Transition.createBoundaryComponent`** for building custom boundary wrappers, including `alreadyAnimated` support
- **Navigation-style bounds zoom** through `bounds({ id }).navigation.zoom()`
- **`navigationMaskEnabled`** for library-managed masked navigation transitions
- **Ancestor targeting** in `useScreenGesture()` and `useScreenAnimation()`
- **Gesture release tuning** with `gestureReleaseVelocityScale`
- **`Transition.Specs.FlingSpec`** for underdamped fling-style release motion
- **Surface slot support** through `surfaceComponent` and the interpolator `surface` slot
- **Animated `props` support across all slots** via `{ style, props }` slot returns
- **Optional first-screen animation** with `experimental_animateOnInitialMount`
- **`logicallySettled`** for choreography that should finish before a spring is fully at rest

### Deprecated / Replaced

- **Legacy interpolator accessors are deprecated.** Use `current.layouts` and `current.snapIndex` instead of top-level `layouts` and `snapIndex`.
- **If you saw older alpha docs using `backgroundComponent` / `background`, use `surfaceComponent` / `surface`.**

### Removed

- Deprecated screen overlay mode and legacy overlay animation props were removed.
- Legacy transition-aware shared-bound registration (`sharedBoundTag` / `Transition.MaskedView`) was removed. Use `Transition.Boundary.*` with `bounds({ id }).navigation.zoom()` and `navigationMaskEnabled`.
- `createComponentStackNavigator` was removed. Use blank stack for embedded and independent flows.
- `maskEnabled`, `expandViaScrollView`, and flat interpolator keys (`contentStyle`, `backdropStyle`, `overlayStyle`) were removed.
- Deprecated Android edge-to-edge bar props on native stack were removed.

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

### 3. Static Config

Blank stack-specific navigator props follow React Navigation's custom navigator pattern.

For the dynamic API, pass them to `<Stack.Navigator>`:

```tsx
const Stack = createBlankStackNavigator();

function App() {
  return (
    <Stack.Navigator independent enableNativeScreens={false}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
}
```

For the static API, keep them in the same config object:

```tsx
import { createBlankStackNavigator } from "react-native-screen-transitions/blank-stack";

const Stack = createBlankStackNavigator({
  initialRouteName: "Home",
  screens: {
    Home: HomeScreen,
    Detail: DetailScreen,
  },
  independent: true,
  enableNativeScreens: false,
});
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
| `SharedIGImage({ sharedBoundTag })`    | Legacy Instagram-style shared image preset |
| `SharedAppleMusic({ sharedBoundTag })` | Legacy Apple Music-style shared element preset |
| `SharedXImage({ sharedBoundTag })`     | Legacy X (Twitter)-style image transition preset |

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
  screenStyleInterpolator: ({ progress, current: { layouts: { screen } } }) => {
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

### Slide from Bottom

```tsx
options={{
  screenStyleInterpolator: ({ progress, current: { layouts: { screen } } }) => {
    "worklet";
    return {
      content: {
        style: {
          transform: [{
            translateY: interpolate(progress, [0, 1], [screen.height, 0]),
          }],
        },
      },
    };
  },
}}
```

### Return Styles

Your interpolator can return:

```tsx
return {
  content: { style: { ... }, props: { ... } },   // Main screen slot
  backdrop: { style: { ... }, props: { ... } },  // Backdrop / blur / dimming
  surface: { style: { ... }, props: { ... } },   // Custom surface layer
  ["my-id"]: { style: { ... }, props: { ... } }, // Specific element via styleId
};
```

Every slot supports animated `style` and animated `props`.
Use the shorthand style-only form when you only need styles, or the explicit
`{ style, props }` form when the wrapped component exposes animatable props.

Return `null`, `undefined`, or `{}` when you want an interpolator frame to apply no transition styles:

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";

  const snapshot = bounds.getSnapshot("hero");
  if (!snapshot) return null;

  return {
    content: {
      style: { opacity: 1 },
    },
  };
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

Built-in starting points are available on `Transition.Specs`:

```tsx
transitionSpec: {
  open: Transition.Specs.DefaultSpec,
  close: Transition.Specs.FlingSpec,
  expand: Transition.Specs.DefaultSnapSpec,
  collapse: Transition.Specs.DefaultSnapSpec,
}
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
| `gestureSensitivity`      | How directly live gesture movement maps to progress (default: 1)         |
| `gestureVelocityImpact`   | How much velocity affects dismissal (default: 0.3)                       |
| `gestureDrivesProgress`   | Whether gesture controls animation progress (default: true)              |
| `gestureSnapVelocityImpact` | How much velocity affects snap targeting (default: 0.1, lower = iOS-like)|
| `gestureReleaseVelocityScale` | Multiplier for post-release spring handoff velocity                    |
| `sheetScrollGestureBehavior` | Nested scroll handoff mode: `"expand-and-collapse"` or `"collapse-only"` |
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

Create multi-stop sheets that snap to defined positions. Works with any gesture direction (bottom sheets, top sheets, side sheets), and supports intrinsic content sizing with `"auto"` snap points.

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

// Auto-sized sheet
<Stack.Screen
  name="Composer"
  options={{
    gestureEnabled: true,
    gestureDirection: "vertical",
    snapPoints: ["auto", 1],
    initialSnapIndex: 0,
    backdropBehavior: "collapse",
    ...Transition.Presets.SlideFromBottom(),
  }}
/>
```

### Options

| Option             | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `snapPoints`       | Array of fractions (0-1) or `"auto"` values where sheet can rest     |
| `initialSnapIndex` | Index of initial snap point (default: 0)                             |
| `gestureSnapLocked` | Locks gesture snapping to current point (programmatic `snapTo` still works) |
| `sheetScrollGestureBehavior` | Nested scroll handoff mode for snap sheets                    |
| `backdropBehavior` | Touch handling: `"block"`, `"passthrough"`, `"dismiss"`, `"collapse"`|
| `backdropComponent` | Custom backdrop component; replaces default backdrop + tap handling    |

### Auto Snap Points

When you use `"auto"`, the library measures the content height and exposes it in `current.layouts.content`:

```tsx
screenStyleInterpolator: ({ current }) => {
  "worklet";

  const contentHeight = current.layouts.content?.height ?? 0;

  return {
    content: {
      style: {
        opacity: interpolate(current.snapIndex, [0, 1], [0.8, 1]),
      },
    },
    "sheet-height-debug": {
      style: {
        opacity: contentHeight > 0 ? 1 : 0,
      },
    },
  };
}
```

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

The animated snap point index is available via `current.snapIndex` in `ScreenInterpolationProps`:

```tsx
screenStyleInterpolator: ({ current }) => {
  // snapIndex interpolates between snap point indices
  // e.g., 0.5 means halfway between snap point 0 and 1
  return {
    content: {
      style: {
        opacity: interpolate(current.snapIndex, [0, 1], [0.5, 1]),
      },
    },
  };
}
```

### ScrollView Behavior

With `Transition.ScrollView` inside a snap-enabled sheet:
- **`sheetScrollGestureBehavior: "expand-and-collapse"`**: At boundary, swipe up expands and swipe down collapses (or dismisses at min if enabled)
- **`sheetScrollGestureBehavior: "collapse-only"`**: Expand works only via deadspace; collapse/dismiss via scroll still works at boundary
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

Animate elements between screens by tagging them. In 3.4, the recommended and forward-compatible API is `Transition.Boundary.*` for explicit bounds ownership.

### 1. Tag the Source

```tsx
<Transition.Boundary.Trigger
  id="avatar"
  onPress={() => navigation.navigate("Profile")}
>
  <Image source={avatar} style={{ width: 50, height: 50 }} />
</Transition.Boundary.Trigger>
```

If the boundary owner is larger than the visual element you want to match,
wrap the measured descendant in `Transition.Boundary.Target`:

```tsx
<Transition.Boundary.Trigger
  id="avatar"
  onPress={() => navigation.navigate("Profile")}
  style={styles.card}
>
  <Transition.Boundary.Target>
    <Image source={avatar} style={styles.image} />
  </Transition.Boundary.Target>

  <View style={styles.copy}>
    <Text style={styles.title}>Profile</Text>
  </View>
</Transition.Boundary.Trigger>
```

### 2. Tag the Destination

```tsx
<Transition.Boundary.View id="avatar">
  <Image source={avatar} style={{ width: 200, height: 200 }} />
</Transition.Boundary.View>
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

### Navigation Zoom

For fullscreen, navigation-style shared transitions:

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";
  return bounds({ id: "avatar" }).navigation.zoom({
    target: "fullscreen",
  });
};
```

### Bounds Options

| Option      | Values                             | Description                   |
| ----------- | ---------------------------------- | ----------------------------- |
| `id`        | string                             | The boundary id to match      |
| `group`     | string                             | Optional group key for paged/detail flows |
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
| `Transition.View`       | Animated view                          |
| `Transition.Pressable`  | Pressable                              |
| `Transition.ScrollView` | ScrollView with gesture coordination   |
| `Transition.FlatList`   | FlatList with gesture coordination     |
| `Transition.Boundary.View` | Explicit bounds destination/source registration |
| `Transition.Boundary.Trigger` | Pressable boundary owner that captures source bounds on press |
| `Transition.Boundary.Target` | Optional nested measurement target inside a boundary owner |

Helper exports:

- `Transition.createBoundaryComponent(Component, { alreadyAnimated?: boolean })`
- `Transition.createTransitionAwareComponent(Component, { isScrollable?: boolean, alreadyAnimated?: boolean })`

---

## Hooks

### useScreenAnimation

Access animation state inside a screen:

```tsx
import { useScreenAnimation } from "react-native-screen-transitions";

function DetailScreen() {
  const animation = useScreenAnimation();
  const parentAnimation = useScreenAnimation("parent");

  const style = useAnimatedStyle(() => ({
    opacity: parentAnimation.value.current.progress,
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
  const parentGesture = useScreenGesture("parent");

  const myPanGesture = Gesture.Pan()
    .simultaneousWithExternalGesture(screenGesture, parentGesture)
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
You can target `"self"`, `"parent"`, `"root"`, or `{ ancestor: number }`.

---

## Advanced Animation Props

The full `screenStyleInterpolator` receives these props:

| Prop             | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `progress`       | Combined progress (0-2)                                  |
| `stackProgress`  | Accumulated progress across entire stack                 |
| `focused`        | Whether this screen is the topmost in the stack          |
| `current`        | Current screen state                                     |
| `previous`       | Previous screen state                                    |
| `next`           | Next screen state                                        |
| `active`         | Screen driving the transition                            |
| `inactive`       | Screen NOT driving the transition                        |
| `insets`         | Safe area insets                                         |
| `bounds`         | Shared element bounds function                           |

Prefer `current.snapIndex`, `current.layouts.screen`, and `current.layouts.content` for new code.

### Screen State Properties

Each screen state (`current`, `previous`, `next`, `active`, `inactive`) contains:

| Property    | Description                              |
| ----------- | ---------------------------------------- |
| `progress`         | Animation progress (0 or 1)                     |
| `closing`          | Whether closing (0 or 1)                        |
| `entering`         | Whether entering (0 or 1)                       |
| `animating`        | Whether animating (0 or 1)                      |
| `logicallySettled` | Whether choreography can treat the screen as done |
| `snapIndex`        | Animated snap point index for this screen       |
| `layouts`          | Screen and measured content layouts             |
| `gesture`          | Gesture values (x, y, `normX`, `normY`, etc.)   |
| `meta`             | Custom metadata from options                    |

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

Blank stack and native stack are the primary APIs. Component stack remains available as a deprecated compatibility API.

| Stack               | Best For                                                  |
| ------------------- | --------------------------------------------------------- |
| **Blank Stack**     | Most apps. Full control, all features.                    |
| **Native Stack**    | When you need native screen primitives.                   |
| **Component Stack** | Legacy embedded-flow API. Prefer blank stack instead.     |

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

## Caveats & Trade-offs

### Native Stack

The Native Stack uses transparent modal presentation to intercept transitions. This has trade-offs:

- **Delayed touch events** – Exiting screens may have briefly delayed touch response
- **beforeRemove listeners** – Relies on navigation lifecycle events
- **Rapid navigation** – Some edge cases with very fast navigation sequences

For most apps, Blank Stack avoids these issues entirely.

---

## Experimental Features

### Animate On Initial Mount

Animate the first screen in a navigator instead of snapping it directly to the settled state:

```tsx
options={{
  experimental_animateOnInitialMount: true,
}}
```

---

## Support

This package is developed in my spare time.

If you'd like to fuel the next release, [buy me a coffee](https://buymeacoffee.com/trpfsu)

## License

MIT
