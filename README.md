# react-native-screen-transitions

Customizable screen transitions for React Native. Build gesture-driven, shared element, and fully custom animations with a simple API.

| iOS                                                                                                                                     | Android                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| <video src="https://github.com/user-attachments/assets/c0d17b8f-7268-421c-9051-e242f8ddca76" width="300" height="600" controls></video> | <video src="https://github.com/user-attachments/assets/3f8d5fb1-96d2-4fe3-860d-62f6fb5a687e" width="300" controls></video> |

## Features

- **Full Animation Control** – Define exactly how screens enter, exit, and respond to gestures
- **Shared Elements** – Measure-driven transitions between screens using the Bounds API
- **Gesture Support** – Swipe-to-dismiss with edge or full-screen activation, works with ScrollViews
- **Two Stack Options** – Pure JS stack (recommended) or native stack integration
- **Stack Progress** – Track animation progress across the entire stack, not just adjacent screens
- **Ready-Made Presets** – Instagram, Apple Music, X (Twitter) style transitions included

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

This package provides three stack navigators:

| Stack                         | Description                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| **Blank Stack** (recommended) | Pure JavaScript stack with full control over transitions, overlays, and gestures.  |
| **Native Stack**              | Extends `@react-navigation/native-stack`. Full overlay support, native primitives. |
| **Component Stack**           | Standalone navigator without React Navigation. For internal/embedded navigation.   |

### Choosing a Stack

**Blank Stack** is feature-rich and recommended for most use cases:

- Full overlay system (float and screen modes)
- Stack progress tracking across the entire stack
- No delayed touch events on exiting screens

However, it's still a JavaScript implementation. While optimized to be as fast as possible (using `react-native-screens` under the hood, with animations and gesture logic running on the UI thread), heavy usage may not match native performance.

**Native Stack** uses native navigation primitives with some trade-offs:

- Full overlay system support (float and screen modes)
- Relies on `beforeRemove` listeners to intercept navigation
- Uses transparent modal presentation which can cause delayed touch events
- Some edge cases with rapid navigation

Choose Native Stack if you need native performance with overlay support.

**Component Stack** is a standalone navigator that doesn't integrate with React Navigation:

- No integration with React Navigation ecosystem (no linking, no deep linking)
- Ideal for embedded navigation within a screen (e.g., onboarding flows, wizards)
- Lightweight, component-based API
- Full transition and gesture support

### Blank Stack Philosophy

The Blank Stack is intentionally **blank** - transparent screens with no default animations. Unlike platform navigators that impose iOS or Android-style transitions, the Blank Stack gives you a clean slate.

**Why no defaults?**

- **Full creative control** – You define exactly how screens appear, not the OS
- **Consistency across platforms** – Same animation on iOS and Android
- **No fighting the framework** – No need to override or disable built-in behaviors

Every screen starts invisible and static. You bring it to life with your own `screenStyleInterpolator`. This encourages intentional, custom transitions rather than settling for platform defaults.

Under the hood, the Blank Stack uses `react-native-screens` for native-level performance. All animation and gesture logic runs on the UI thread via Reanimated worklets.

```tsx
// A screen with no options = invisible, no animation
<Stack.Screen name="Detail" component={DetailScreen} />

// Add your own transition
<Stack.Screen
  name="Detail"
  component={DetailScreen}
  options={{
    screenStyleInterpolator: ({ progress, layouts }) => {
      "worklet";
      return {
        contentStyle: {
          opacity: progress,
          transform: [
            { translateY: interpolate(progress, [0, 1], [layouts.screen.height, 0]) }
          ],
        },
      };
    },
  }}
/>
```

### Blank Stack Setup

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

### Blank Stack with Expo Router

```tsx
import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import {
  createBlankStackNavigator,
  type BlankStackNavigationEventMap,
  type BlankStackNavigationOptions,
} from "react-native-screen-transitions/blank-stack";

const { Navigator } = createBlankStackNavigator();

export const Stack = withLayoutContext<
  BlankStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  BlankStackNavigationEventMap
>(Navigator);
```

---

## Presets

Built-in animation presets you can spread into screen options:

```tsx
<Stack.Screen
  name="Detail"
  options={{
    ...Transition.Presets.SlideFromBottom(),
  }}
/>
```

| Preset                                 | Description                                     |
| -------------------------------------- | ----------------------------------------------- |
| `SlideFromTop()`                       | Slides in from top, vertical gesture dismiss    |
| `SlideFromBottom()`                    | Slides in from bottom, vertical gesture dismiss |
| `ZoomIn()`                             | Scales in with fade, no gesture                 |
| `DraggableCard()`                      | Multi-directional drag with card scaling        |
| `ElasticCard()`                        | Elastic drag with overlay darkening             |
| `SharedIGImage({ sharedBoundTag })`    | Instagram-style shared image transition         |
| `SharedAppleMusic({ sharedBoundTag })` | Apple Music-style shared element                |
| `SharedXImage({ sharedBoundTag })`     | X (Twitter)-style image transition              |

---

## Custom Animations

### Using `screenStyleInterpolator`

Define custom transitions directly in screen options. The interpolator receives animation state and returns styles:

```tsx
import { interpolate } from "react-native-reanimated";

<Stack.Screen
  name="Detail"
  options={{
    screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
      "worklet";

      const translateX = interpolate(
        progress,
        [0, 1, 2],
        [screen.width, 0, -screen.width]
      );

      return {
        contentStyle: {
          transform: [{ translateX }],
        },
      };
    },
    transitionSpec: {
      open: Transition.Specs.DefaultSpec,
      close: Transition.Specs.DefaultSpec,
    },
  }}
/>;
```

### Interpolator Props

| Prop             | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `progress`       | Combined progress (0-2). 0=entering, 1=active, 2=exiting |
| `stackProgress`  | Accumulated progress across entire stack (0, 1, 2, 3...) |
| `current`        | Current screen state (progress, closing, gesture, meta)  |
| `previous`       | Previous screen state (may be undefined)                 |
| `next`           | Next screen state (may be undefined)                     |
| `layouts.screen` | Screen dimensions `{ width, height }`                    |
| `insets`         | Safe area insets `{ top, right, bottom, left }`          |
| `focused`        | Whether current screen is the topmost                    |
| `active`         | The screen driving the transition                        |
| `inactive`       | The screen NOT driving the transition                    |
| `bounds`         | Function to access shared element positions              |

### Screen State (`current`, `previous`, `next`, `active`, `inactive`)

Each screen state contains:

| Property    | Description                                           |
| ----------- | ----------------------------------------------------- |
| `progress`  | Animation progress for this screen (0 or 1)           |
| `closing`   | Whether screen is closing (0 or 1)                    |
| `animating` | Whether screen is currently animating (0 or 1)        |
| `gesture`   | Gesture values (x, y, normalizedX, normalizedY, etc.) |
| `meta`      | Custom metadata from screen options                   |

### Understanding `active` and `inactive`

The `active` and `inactive` props help you write cleaner conditional logic:

- **`active`** – The screen driving the transition. When focused, this is `current`. When not focused, this is `next`.
- **`inactive`** – The screen NOT driving the transition. When focused, this is `previous`. When not focused, this is `current`.

```tsx
// Check if the inactive screen wants to disable an animation
const disableTranslateY = props.inactive?.meta?.disableTranslateYAnimation;

// Check if the active screen is animating or closing
const isAnimating = props.active.animating;
const isClosing = props.active.closing;
```

### Using `meta` for Conditional Logic

Use `meta` to pass custom data for conditional animation logic. This is more robust than checking route names:

```tsx
// Screen A sets meta to affect how Screen B animates
<Stack.Screen
  name="ScreenA"
  options={{
    meta: { disableTranslateYAnimation: true },
  }}
/>

// Screen B checks inactive screen's meta
<Stack.Screen
  name="ScreenB"
  options={{
    screenStyleInterpolator: (props) => {
      "worklet";

      // When entering from ScreenA, inactive = ScreenA (previous)
      // When going back to ScreenA, inactive = ScreenB (current)
      const disableY = props.inactive?.meta?.disableTranslateYAnimation;

      return {
        contentStyle: {
          transform: [{ translateY: disableY ? 0 : translateY }],
        },
      };
    },
  }}
/>
```

You can also react to screen state changes within components:

```tsx
const animation = useScreenAnimation();

useAnimatedReaction(
  () => animation.value,
  (props) => {
    // React to next screen's meta
    if (props.next?.meta?.scalesOthers) {
      scale.value = withTiming(0);
    }
  }
);
```

### Return Value

```tsx
return {
  contentStyle: { ... },        // Main screen content
  overlayStyle: { ... },        // Semi-transparent overlay
  ["my-element"]: { ... },      // Styles for Transition.View with styleId="my-element"
};
```

### Using `styleId` for Individual Elements

Animate specific elements within a screen:

```tsx
// In screen options
screenStyleInterpolator: ({ progress }) => {
  "worklet";
  return {
    "hero-image": {
      opacity: interpolate(progress, [0, 1], [0, 1]),
      transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }],
    },
  };
};

// In component
<Transition.View styleId="hero-image">
  <Image source={...} />
</Transition.View>
```

---

## Shared Elements (Bounds API)

Animate elements between screens by measuring their positions.

### 1. Tag Elements on Both Screens

```tsx
// Source screen
<Transition.Pressable
  sharedBoundTag="avatar"
  onPress={() => navigation.navigate("Profile")}
>
  <Image source={avatar} style={{ width: 50, height: 50 }} />
</Transition.Pressable>

// Destination screen
<Transition.View sharedBoundTag="avatar">
  <Image source={avatar} style={{ width: 200, height: 200 }} />
</Transition.View>
```

### 2. Use Bounds in Interpolator

```tsx
screenStyleInterpolator: ({ bounds }) => {
  "worklet";

  const avatarStyles = bounds({
    id: "avatar",
    method: "transform", // "transform" | "size" | "content"
    space: "relative", // "relative" | "absolute"
    scaleMode: "match", // "match" | "none" | "uniform"
    anchor: "center", // positioning anchor
  });

  return {
    avatar: avatarStyles,
  };
};
```

### Bounds Options

| Option      | Values                                 | Description                            |
| ----------- | -------------------------------------- | -------------------------------------- |
| `id`        | string                                 | The `sharedBoundTag` to match          |
| `method`    | `"transform"` `"size"` `"content"`     | How to animate (scale vs width/height) |
| `space`     | `"relative"` `"absolute"`              | Coordinate space                       |
| `scaleMode` | `"match"` `"none"` `"uniform"`         | How to handle aspect ratio             |
| `anchor`    | `"center"` `"top"` `"topLeading"` etc. | Transform origin                       |
| `target`    | `"bound"` `"fullscreen"` or custom     | Destination target                     |
| `raw`       | boolean                                | Return raw values instead of styles    |

### Raw Values

```tsx
const raw = bounds({ id: "avatar", method: "transform", raw: true });
// { translateX, translateY, scaleX, scaleY }
```

### Bounds Utilities

Access additional bounds data for custom animations:

```tsx
screenStyleInterpolator: ({ bounds, progress }) => {
  "worklet";

  // Get the active link between source and destination
  const link = bounds.getLink("avatar");
  // { source: { bounds, styles }, destination: { bounds, styles } }

  // Interpolate a style property (e.g., borderRadius) between source and destination
  const borderRadius = bounds.interpolateStyle("avatar", "borderRadius");

  // Or access raw values for custom logic
  const sourceBorderRadius = link?.source?.styles?.borderRadius ?? 0;

  return {
    avatar: {
      ...bounds({ id: "avatar" }),
      borderRadius,
    },
  };
};
```

| Method                                         | Description                                         |
| ---------------------------------------------- | --------------------------------------------------- |
| `bounds.getLink(id)`                           | Get source/destination bounds and styles for a tag  |
| `bounds.interpolateStyle(id, prop, fallback?)` | Interpolate a numeric style between source and dest |
| `bounds.getSnapshot(id, key)`                  | Manual lookup by specific screen key (edge cases)   |

---

## Gestures

Enable swipe-to-dismiss on screens:

```tsx
<Stack.Screen
  name="Detail"
  options={{
    gestureEnabled: true,
    gestureDirection: "vertical", // or "horizontal", ["vertical", "horizontal"]
    gestureActivationArea: "edge", // or "screen", or { left: "edge", top: "screen" }
    gestureResponseDistance: 50,
    gestureVelocityImpact: 0.3,
  }}
/>
```

### Gesture Options

| Option                    | Description                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `gestureEnabled`          | Enable/disable gesture                                                             |
| `gestureDirection`        | `"horizontal"` `"vertical"` `"horizontal-inverted"` `"vertical-inverted"` or array |
| `gestureActivationArea`   | `"edge"` `"screen"` or per-side config                                             |
| `gestureResponseDistance` | Distance threshold for gesture recognition                                         |
| `gestureVelocityImpact`   | How much velocity affects dismissal decision                                       |
| `gestureDrivesProgress`   | Whether gesture directly drives animation (default: true)                          |

### Gestures with ScrollViews

Use transition-aware scrollables so gestures work correctly:

```tsx
import Transition from "react-native-screen-transitions";

// Drop-in replacements
<Transition.ScrollView>
  {/* content */}
</Transition.ScrollView>

<Transition.FlatList
  data={items}
  renderItem={...}
/>

// Wrap custom lists
const TransitionFlashList = Transition.createTransitionAwareComponent(
  FlashList,
  { isScrollable: true }
);
```

Gesture rules with scrollables:

- **vertical** – only starts when scrolled to top
- **vertical-inverted** – only starts when scrolled to bottom
- **horizontal** – only starts at left/right edge

---

## Overlays

Both Blank Stack and Native Stack support persistent overlays that animate across screen transitions.

### Float Overlay

A single overlay that persists above all screens:

```tsx
const FloatingHeader = ({ focusedIndex, routes, overlayAnimation }) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(overlayAnimation.value.progress, [0, 1], [0, 1]),
  }));

  return (
    <Animated.View style={[styles.header, style]}>
      <Text>
        Screen {focusedIndex + 1} of {routes.length}
      </Text>
    </Animated.View>
  );
};

<Stack.Screen
  name="Home"
  options={{
    overlay: FloatingHeader,
    overlayMode: "float",
    overlayShown: true,
  }}
/>;
```

### Screen Overlay

An overlay that moves with screen content:

```tsx
<Stack.Screen
  name="Detail"
  options={{
    overlay: DetailOverlay,
    overlayMode: "screen",
    overlayShown: true,
  }}
/>
```

### Overlay Props

| Prop               | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `focusedRoute`     | Currently focused route                                   |
| `focusedIndex`     | Index of focused screen                                   |
| `routes`           | All routes in the stack                                   |
| `meta`             | Custom metadata passed from screen options                |
| `navigation`       | Navigation prop                                           |
| `overlayAnimation` | Animation values with `progress` accumulated across stack |
| `screenAnimation`  | Animation values for the current focused screen           |

### Passing Custom Data

```tsx
<Stack.Screen
  options={{
    overlay: MyOverlay,
    meta: {
      title: "Step 1",
      showProgress: true,
    },
  }}
/>;

// In overlay
const MyOverlay = ({ meta }) => {
  return <Text>{meta?.title}</Text>;
};
```

---

## Transition Components

| Component               | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `Transition.View`       | Animated view, supports `styleId` and `sharedBoundTag` |
| `Transition.Pressable`  | Pressable with bounds measurement on press             |
| `Transition.ScrollView` | ScrollView with gesture coordination                   |
| `Transition.FlatList`   | FlatList with gesture coordination                     |
| `Transition.MaskedView` | For clipping during shared element transitions         |

### Creating Custom Components

```tsx
const TransitionImage = Transition.createTransitionAwareComponent(
  Animated.Image,
  { isScrollable: false }
);
```

---

## Hooks

### `useScreenAnimation`

Access animation state within a screen component:

```tsx
import { useScreenAnimation } from "react-native-screen-transitions";

function DetailScreen() {
  const animation = useScreenAnimation();

  const style = useAnimatedStyle(() => {
    const { current } = animation.value;
    return {
      opacity: current.progress,
    };
  });

  return <Animated.View style={style}>...</Animated.View>;
}
```

---

## Animation Specs

Configure spring/timing animations:

```tsx
transitionSpec: {
  open: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
  },
  close: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
  },
}

// Or use the default
transitionSpec: {
  open: Transition.Specs.DefaultSpec,
  close: Transition.Specs.DefaultSpec,
}
```

---

## Masked View Setup

Required for `SharedIGImage` and `SharedAppleMusic` presets. The masked view creates the "reveal" effect where content appears to expand from the shared element.

> **Note**: Requires native code. Will not work in Expo Go.

### Installation

```bash
# Expo
npx expo install @react-native-masked-view/masked-view

# Bare React Native
npm install @react-native-masked-view/masked-view
cd ios && pod install
```

### Complete Example

Here's a full example showing how to set up an Apple Music-style shared element transition:

**1. Source Screen** – Tag pressable elements with `sharedBoundTag`:

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

**2. Destination Screen** – Wrap content with `MaskedView` and match the `sharedBoundTag`:

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

**3. Layout** – Apply the shared element preset with dynamic `sharedBoundTag`:

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

1. `Transition.Pressable` measures its bounds when pressed and stores them with the `sharedBoundTag`
2. `Transition.View` on the destination screen registers as the target for that tag
3. `Transition.MaskedView` clips the destination content to the animating shared element bounds
4. The preset interpolates position, size, and the mask to create the seamless expand/collapse effect

---

## Native Stack

For cases where you need native screen primitives, use the native stack integration. This extends `@react-navigation/native-stack` with custom transition support.

> **Note**: The native stack has limitations. It uses `beforeRemove` listeners and transparent modals to intercept transitions. The Blank Stack is recommended for most use cases.

### Setup

```tsx
import { createNativeStackNavigator } from "react-native-screen-transitions/native-stack";

const Stack = createNativeStackNavigator();

<Stack.Screen
  name="Detail"
  options={{
    enableTransitions: true, // Required to enable custom transitions
    ...Transition.Presets.SlideFromBottom(),
  }}
/>;
```

### Expo Router Setup

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
} from "react-native-screen-transitions/native-stack";

const { Navigator } = createNativeStackNavigator();

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(Navigator);
```

### Native Stack Options

All standard `@react-navigation/native-stack` options are available, plus:

| Option                    | Type                                     | Description                                                        |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `enableTransitions`       | `boolean`                                | Enable custom transitions (sets presentation to transparent modal) |
| `screenStyleInterpolator` | `ScreenStyleInterpolator`                | Function that returns animated styles                              |
| `transitionSpec`          | `TransitionSpec`                         | Animation config for open/close                                    |
| `gestureEnabled`          | `boolean`                                | Whether swipe-to-dismiss is allowed                                |
| `gestureDirection`        | `GestureDirection \| GestureDirection[]` | Allowed swipe directions                                           |
| `gestureVelocityImpact`   | `number`                                 | How much velocity affects dismissal                                |
| `gestureResponseDistance` | `number`                                 | Distance threshold for gesture                                     |
| `gestureDrivesProgress`   | `boolean`                                | Whether gesture drives animation                                   |
| `gestureActivationArea`   | `GestureActivationArea`                  | Where gesture can start                                            |
| `meta`                    | `Record<string, unknown>`                | Custom metadata for conditional animation logic                    |

### Renamed Native Options

To avoid collisions with custom gesture options, some native options are renamed:

| React Navigation          | Renamed to                      |
| ------------------------- | ------------------------------- |
| `gestureDirection`        | `nativeGestureDirection`        |
| `gestureEnabled`          | `nativeGestureEnabled`          |
| `gestureResponseDistance` | `nativeGestureResponseDistance` |

### Limitations

- Relies on `beforeRemove` listener to intercept navigation
- Uses transparent modal presentation
- Some edge cases with rapid navigation

---

## Component Stack

A standalone navigator for when you don't need React Navigation integration. Perfect for embedded flows like onboarding, wizards, or any self-contained navigation.

### Setup

```tsx
import {
  createComponentNavigator,
  useComponentNavigation,
} from "react-native-screen-transitions/component-stack";
import Transition from "react-native-screen-transitions";

const Stack = createComponentNavigator();

function OnboardingFlow() {
  return (
    <Stack.Navigator initialRoute="step1">
      <Stack.Screen
        name="step1"
        component={Step1}
        options={{
          ...Transition.Presets.SlideFromBottom(),
        }}
      />
      <Stack.Screen
        name="step2"
        component={Step2}
        options={{
          ...Transition.Presets.SlideFromBottom(),
        }}
      />
    </Stack.Navigator>
  );
}

function Step1() {
  const navigation = useComponentNavigation();

  return (
    <View>
      <Text>Step 1</Text>
      <Button title="Next" onPress={() => navigation.push("step2")} />
    </View>
  );
}
```

### Navigation API

```tsx
const navigation = useComponentNavigation();

navigation.push("screenName", { param: "value" }); // Push a screen
navigation.pop(); // Go back
navigation.popTo("screenName"); // Pop to a specific screen
navigation.reset("screenName"); // Reset to a single screen
```

### When to Use Component Stack

- **Onboarding flows** – Self-contained multi-step experiences
- **Wizards/Forms** – Multi-step forms within a screen
- **Embedded navigation** – Navigation inside a modal or sheet
- **Non-URL navigation** – When you don't need deep linking

---

## Experimental Features

### High Refresh Rate

Force the display to run at maximum refresh rate during transitions. This can make animations smoother on high refresh rate displays (90Hz, 120Hz).

```tsx
<Stack.Screen
  name="Detail"
  options={{
    experimental_enableHighRefreshRate: true,
    ...Transition.Presets.SlideFromBottom(),
  }}
/>
```

> **Note**: This is experimental and may have performance implications. Test on target devices.

---

## Migrating from Earlier Versions

### Deprecated Props

The following props are deprecated and will be removed in a future version:

| Deprecated Prop         | Use Instead        |
| ----------------------- | ------------------ |
| `isActiveTransitioning` | `active.animating` |
| `isDismissing`          | `active.closing`   |

---

## Support

This package is developed in my spare time. Updates and bug fixes may take time.

If you'd like to fuel the next release, [buy me a coffee](https://buymeacoffee.com/trpfsu)

## License

MIT
