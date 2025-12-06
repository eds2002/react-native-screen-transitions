# Tray Animations

This example recreates the beautiful tray navigation pattern popularized by [Family Wallet](https://family.co/).

Massive respect to the design engineers at Family who crafted this interaction. It's genuinely beautiful to see in action.

## Requirements

This example **requires a development build**. It cannot run in Expo Go due to its dependency on `@react-native-masked-view/masked-view`.

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a development build

   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

3. Start the development server

   ```bash
   npx expo start --dev-client
   ```

## How It Works

The tray animation is built using `screen-transitions`, allowing you to define custom enter/exit animations for each route. The key to achieving the Family Wallet feel is the combination of:

- Masked views for the rounded corner clipping effect
- Carefully tuned spring animations for natural movement

## Credits

- Original design concept: [Family Wallet](https://family.co/)
- Built with [Expo](https://expo.dev) and [screen-transitions](https://github.com/example/screen-transitions)
