# Expo Router Example

This example app demonstrates the features of `react-native-screen-transitions` with Expo Router.

## Prerequisites

- **Note**: This app requires a **development build** (won't work in Expo Go) due to native dependencies like `@react-native-masked-view/masked-view`

## Installation

### 1. Install Dependencies

From the **project root** directory:

```bash
# With Bun
bun install

# With Yarn
yarn install

# With pnpm
pnpm install
```

### 2. Build the Library

From the **project root** directory:

```bash
# With Bun
bun run build

# With Yarn
yarn build

# With pnpm
pnpm build
```

## Running the App

### First Time Setup - Build Development Build

Since this app uses native modules, you need to create a development build first:

```bash
# Navigate to the example directory
cd examples/expo-router-example

# For iOS (Mac only)
npx expo run:ios

# For Android
npx expo run:android
```

This will:

- Install native dependencies
- Build the development build
- Launch the app on your simulator/device

### Subsequent Runs

After the initial build, you can use:

```bash
# Start the dev server
bun start
# or
yarn start
# or
pnpm start
```

Or run directly:

```bash
# iOS
bun run ios
# or yarn ios / pnpm ios

# Android
bun run android
# or yarn android / pnpm android
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `expo start --dev-client` | Start the development server |
| `ios` | `expo run:ios` | Build and run on iOS simulator |
| `android` | `expo run:android` | Build and run on Android emulator |
| `web` | `expo start --web` | Run web version (not fully supported) |
| `test` | `jest --watchAll` | Run unit tests |

## Features Demonstrated

This example app includes demonstrations of:

- **Custom Transitions**: Various preset animations (slide, zoom, fade, etc.)
- **Gesture Controls**: Swipe-to-dismiss with customizable directions
- **Shared Elements**: Bounds API for Instagram, Apple Music, and X-style transitions
- **Scroll Integration**: Swipe-to-dismiss with ScrollView, FlatList, and FlashList
- **Nested Navigators**: Complex navigation hierarchies
- **E2E Examples**: Real-world app patterns

## Navigation Structure

```
app/
├── index.tsx                    # Home screen with all examples
├── custom-transitions/          # Preset demos
├── presets/                     # Animation presets
├── bounds/                      # Bounds API examples
├── examples/                    # Real-world app patterns
│   ├── instagram/              # Instagram-style transitions
│   ├── apple-music/            # Apple Music-style transitions
│   └── x/                      # X (Twitter)-style transitions
└── e2e/                        # E2E test screens
```

## Testing

### Manual Testing

Run the app and explore the examples in the UI.

### E2E Testing

From the **project root** directory:

```bash
bun run e2e
# or yarn e2e / pnpm e2e
```

Requires [Maestro CLI](https://maestro.mobile.dev/getting-started/installing-maestro) installed.

### Unit Tests

```bash
bun test
# or yarn test / pnpm test
```
