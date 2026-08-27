# Screen Transitions v3 + Expo Router starter

A minimal Expo SDK 55 app showing the stable v3 Expo Router integration. It deliberately uses the pre-fork `createBlankStackNavigator()` and `withLayoutContext()` shape documented by Screen Transitions v3.

## Run it

```bash
bun install
bun start
```

You can use npm, yarn, or pnpm instead. The app contains a normal detail transition, a two-detent snap sheet, and a paired-boundary zoom using a remote image.

## Why SDK 55?

Expo SDK 55 is the final Expo Router generation backed by external React Navigation packages, so this starter exercises the newest environment supported by the v3 integration. Expo Router forks those packages in SDK 56.

Do not upgrade this starter to Expo SDK 56 and keep the same navigator wrapper. SDK 56+ Expo Router apps need the separate Screen Transitions v4 alpha integration.

The v3 integration is isolated in [`src/navigation/blank-stack.tsx`](src/navigation/blank-stack.tsx). Route declarations and the zoom interpolator live in [`src/app/_layout.tsx`](src/app/_layout.tsx), with matching media boundaries in [`src/app/index.tsx`](src/app/index.tsx) and [`src/app/media.tsx`](src/app/media.tsx).
