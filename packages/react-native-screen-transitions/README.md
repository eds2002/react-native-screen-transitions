# react-native-screen-transitions

Customizable screen transitions for React Native. Build gesture-driven, shared element, sheet, and fully custom animations with a simple API.

| iOS | Android |
| --- | ------- |
| <video src="https://github.com/user-attachments/assets/c0d17b8f-7268-421c-9051-e242f8ddca76" width="300" height="600" controls></video> | <video src="https://github.com/user-attachments/assets/3f8d5fb1-96d2-4fe3-860d-62f6fb5a687e" width="300" controls></video> |

## Features

- Full animation control for screen enter, exit, and gesture-driven states.
- Shared element and fullscreen navigation zoom transitions through the Bounds API.
- Snap-point sheets with gesture-aware `ScrollView` and `FlatList` coordination.
- Transition slots for content, backdrop, surface, and custom tagged elements.
- Built-in presets for common modal, card, and shared-transition patterns.
- Blank stack, native stack, and Expo Router integration.
- Written in TypeScript.

## Navigation Compatibility

This README documents the stable v3 release.

| Navigation setup | v3 status | Integration |
| ---------------- | --------- | ----------- |
| React Navigation 6 or 7 | Supported | Use the v3 blank stack or native-stack adapter APIs. |
| Expo Router on Expo SDK 55 or earlier | Supported | Wrap the v3 blank stack with `withLayoutContext()`. |
| Expo Router on Expo SDK 56 or later | Not supported by v3 | Use the [v4 alpha Expo Router integration](https://screen-transitions.esjr.org/v4-experimental/getting-started). |

Expo SDK 55 is the last Expo Router release that uses the React Navigation-backed integration documented for v3. Expo Router forked the navigation packages it builds upon in SDK 56, so the v3 and SDK 56+ navigator internals cannot be mixed. See Expo's [SDK 55 to 56 migration guide](https://docs.expo.dev/router/migrate/sdk-55-to-56/) for the upstream change.

## Getting Started

Install the package:

```bash
npm install react-native-screen-transitions
```

Install peer dependencies:

```bash
npm install react-native-reanimated react-native-gesture-handler \
  @react-navigation/native @react-navigation/native-stack \
  @react-navigation/elements react-native-screens \
  react-native-safe-area-context
```

See [the documentation site](https://screen-transitions.esjr.org).

For complete runnable projects, start with the [v3 Expo Router starter](https://github.com/eds2002/react-native-screen-transitions/tree/main/starters/expo-router), which pins the final supported Expo Router environment on Expo SDK 55, or the [v3 React Navigation starter](https://github.com/eds2002/react-native-screen-transitions/tree/main/starters/react-navigation).

## Support

v3 (current) supports Reanimated v3, Reanimated v4, and React Native Gesture Handler v2.

| Line | Reanimated | React Native Gesture Handler |
| ---- | ---------- | ---------------------------- |
| v3 (current) | v3, v4 | v2 |

## Author

Ed

## Funding

If this library saves your team time, [sponsor it on GitHub](https://github.com/sponsors/eds2002) or [buy me a coffee](https://buymeacoffee.com/trpfsu) to support maintenance.

## License

MIT
