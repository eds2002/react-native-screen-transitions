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
- First-class fixed-footprint clip presentations with `Transition.ClipView` and `Transition.Boundary.ClipView`.
- Built-in presets for common modal, card, and shared-transition patterns.
- Blank stack, native stack, and Expo Router integration.
- Written in TypeScript.

## Getting Started

Install the package:

```bash
npm install react-native-screen-transitions
```

Install peer dependencies:

```bash
npm install react-native-reanimated react-native-gesture-handler \
  react-native-worklets react-native-smooth-clip-view \
  @react-navigation/native @react-navigation/native-stack \
  @react-navigation/elements react-native-screens \
  react-native-safe-area-context
```

See [the documentation site](https://screen-transitions.esjr.org).

## Support

v4 is Fabric-only and requires React Native 0.86+, React 19.2+, Reanimated 4.5+, Worklets 0.10+, SmoothClip 0.3, iOS 16.4+, and Android API 33+. React Native Web is not supported because SmoothClip is native-only. v3 remains the compatibility line for older applications.

| Line | Architecture | Reanimated | SmoothClip |
| ---- | ------------ | ---------- | ---------- |
| v4 | Fabric | >=4.5 | ^0.3.0 |
| v3 | Paper / Fabric | v3, v4 | not required |

## Author

Ed

## Funding

If this library saves your team time, [sponsor it on GitHub](https://github.com/sponsors/eds2002) or [buy me a coffee](https://buymeacoffee.com/trpfsu) to support maintenance.

## License

MIT
