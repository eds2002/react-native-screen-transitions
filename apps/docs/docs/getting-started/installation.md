---
title: Installation
sidebar_position: 1
---

import PackageManagerTabs from "@site/src/components/PackageManagerTabs";

# Installation

Install the transition package first, then bring in the runtime peers it relies on.

## 1. Install the package

<PackageManagerTabs command="npm install react-native-screen-transitions" />

## 2. Install the peer runtime

These are the packages the navigators, gestures, screen containers, and animation pipeline are built on top of.

<PackageManagerTabs command="npm install react-native-reanimated react-native-gesture-handler @react-navigation/native @react-navigation/native-stack @react-navigation/elements react-native-screens react-native-safe-area-context" />

## 3. Optional masking support

If you use `Transition.MaskedView` or navigation zoom transitions through `bounds().navigation.zoom()`, install masked view support as an extra dependency.

<PackageManagerTabs command="npm install @react-native-masked-view/masked-view" />

This is not required for normal stack transitions, slot-based interpolators, or snap-point sheets.

## Supported entry points

The docs and generated API reference only cover the supported public surface. Everything else should be treated as internal.

- `react-native-screen-transitions`
- `react-native-screen-transitions/blank-stack`
- `react-native-screen-transitions/native-stack`
- `react-native-screen-transitions/component-stack`

## Recommended starting point

If you are new to the library, start with `blank-stack`. It is the clearest expression of how the package works, and it is the stack surface most of the docs assume first.

Reach for `native-stack` when you want to preserve more of that mental model, and use `component-stack` when the navigator itself is part of the product UI instead of the app shell.

## Next steps

Once the dependencies are in place, build one real screen transition and then learn the model behind it.

- [Build your first navigator →](./quickstart)
- [Understand the mental model →](../core-mental-model)
