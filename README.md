# react-native-screen-transitions

Gesture-driven screen transitions, shared bounds, presets, and custom animation hooks for React Native and Expo.

## Install

```bash
npm install react-native-screen-transitions
```

Peer dependencies:

```bash
npm install react-native-reanimated react-native-gesture-handler \
  @react-navigation/native @react-navigation/native-stack \
  @react-navigation/elements react-native-screens \
  react-native-safe-area-context
```

## Quickstart

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

## Docs

- Docs site: `https://eds2002.github.io/react-native-screen-transitions/`
- Stable docs line: `3.x`
- Unreleased docs line: `Next`
- Example app: [`apps/e2e`](./apps/e2e)

## Public entrypoints

- `react-native-screen-transitions`
- `react-native-screen-transitions/blank-stack`
- `react-native-screen-transitions/native-stack`
- `react-native-screen-transitions/component-stack`
