---
title: Installation
sidebar_position: 1
---

# Installation

Install the package itself:

```bash
npm install react-native-screen-transitions
```

Install the peer dependencies used by the navigators and animation pipeline:

```bash
npm install react-native-reanimated react-native-gesture-handler \
  @react-navigation/native @react-navigation/native-stack \
  @react-navigation/elements react-native-screens \
  react-native-safe-area-context
```

## Optional dependency

If you want navigation masking for bounds-based zoom transitions, also install masked view support:

```bash
npm install @react-native-masked-view/masked-view
```

Then enable masking on the screen:

```tsx
options={{
  navigationMaskEnabled: true,
}}
```

## Package entrypoints

The package exposes four public entrypoints:

- `react-native-screen-transitions`
- `react-native-screen-transitions/blank-stack`
- `react-native-screen-transitions/native-stack`
- `react-native-screen-transitions/component-stack`

The docs and API reference are generated around those entrypoints only. Internal modules are not treated as public surface.

## Next steps

- Build your first navigator in [Quickstart](./quickstart.md)
- Compare navigator tradeoffs in [Stack Variants](../stack-variants/index.md)
