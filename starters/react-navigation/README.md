# Screen Transitions v4 + React Navigation starter

A minimal Expo SDK 56 app using upstream React Navigation and the v4 Standard Navigator entry point. It intentionally does not install Expo Router.

## Run it

```bash
bun install
bun start
```

You can use npm, yarn, or pnpm instead. The app contains the same detail transition, two-detent snap sheet, and paired-boundary remote-image zoom as the Expo Router starter.

## Start from your own Expo app

Start with any compatible Expo template, then install React Navigation, the v4 alpha, and the Expo-selected native peers:

```bash
npx expo install @react-navigation/native \
  react-native-screen-transitions@alpha \
  react-native-reanimated react-native-worklets \
  react-native-gesture-handler react-native-screens \
  react-native-safe-area-context
```

Create the navigator with `createBlankStackNavigator()` from `react-native-screen-transitions/react-navigation` and render it inside the normal `NavigationContainer`. No custom Metro config, type-resolution override, root-view wrapper, or generated-file edit is required.

Keeping this app separate from the Expo Router starter proves that application code targets one host at a time; this app has no Expo Router adapter or route setup.

Navigator setup and the zoom interpolator live in [`App.tsx`](App.tsx), while screen parameter types live in [`src/navigation/types.ts`](src/navigation/types.ts). The matching media boundaries are in [`src/screens/home-screen.tsx`](src/screens/home-screen.tsx) and [`src/screens/media-screen.tsx`](src/screens/media-screen.tsx).
