# Screen Transitions v4 + Expo Router starter

A minimal Expo SDK 56 app showing the v4 Expo Router integration. `BlankStack` comes directly from the package's Expo Router entry point; there is no local `withLayoutContext()` wrapper.

## Run it

```bash
bun install
bun start
```

You can use npm, yarn, or pnpm instead. The app contains a normal detail transition, a two-detent snap sheet, and a paired-boundary zoom using a remote image.

## Start from your own Expo app

Start with any Expo Router template on a compatible SDK, then install the v4 alpha and its Expo-selected native peers:

```bash
npx expo install react-native-screen-transitions@alpha \
  react-native-reanimated react-native-worklets \
  react-native-gesture-handler react-native-screens \
  react-native-safe-area-context
```

Import `BlankStack` from `react-native-screen-transitions/expo-router` in the layout where you want transitions. No custom Metro config, type-resolution override, root-view wrapper, or generated-file edit is required.

Route declarations and the zoom interpolator live in [`src/app/_layout.tsx`](src/app/_layout.tsx), with matching media boundaries in [`src/app/index.tsx`](src/app/index.tsx) and [`src/app/media.tsx`](src/app/media.tsx).
