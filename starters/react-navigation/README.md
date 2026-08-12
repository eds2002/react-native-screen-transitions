# Screen Transitions v3 + React Navigation starter

A minimal Expo SDK 55 app using upstream React Navigation and the stable Screen Transitions v3 blank stack. It intentionally does not install Expo Router.

## Run it

```bash
bun install
bun start
```

You can use npm, yarn, or pnpm instead. The app contains the same detail transition, two-detent snap sheet, and paired-boundary remote-image zoom as the Expo Router starter.

## Why a separate starter?

Expo Router and React Navigation are separate navigation hosts after the Expo Router fork. Keeping this app separate demonstrates that v3 consumes upstream `@react-navigation/*` packages directly and avoids suggesting that applications should install both hosts.

This starter also uses Expo SDK 55 so its native runtime matches the Expo Router v3 starter. Unlike the v3 Expo Router wrapper, direct React Navigation support is not limited by Expo Router's SDK 56 fork.

Navigator setup and the zoom interpolator live in [`App.tsx`](App.tsx), while screen parameter types live in [`src/navigation/types.ts`](src/navigation/types.ts). The matching media boundaries are in [`src/screens/home-screen.tsx`](src/screens/home-screen.tsx) and [`src/screens/media-screen.tsx`](src/screens/media-screen.tsx).
