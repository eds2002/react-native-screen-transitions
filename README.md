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
- Blank stack and Expo Router integration.
- Written in TypeScript.

## Getting Started

Install the package:

```bash
npm install react-native-screen-transitions
```

Install peer dependencies:

```bash
npm install react-native-reanimated react-native-gesture-handler \
  react-native-worklets react-native-teleport \
  @react-navigation/native @react-navigation/elements \
  react-native-safe-area-context
```

See [the documentation site](https://screen-transitions.esjr.org).

## Support

v4 targets Reanimated v4, React Native Gesture Handler v3, and React 19.2.

| Line | Reanimated | React Native Gesture Handler |
| ---- | ---------- | ---------------------------- |
| v4 | v4 | v3 |

## Author

Ed

## Sponsor & Support

If you'd like to fuel the next release, [buy me a coffee](https://buymeacoffee.com/trpfsu).

## License

MIT
