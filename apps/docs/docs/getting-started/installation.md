---
title: Installation
sidebar_position: 1
---

import Link from "@docusaurus/Link";
import PackageManagerTabs from "@site/src/components/PackageManagerTabs";

## Quick Start

Install the core package first. This adds the transition package itself — you can wire up a navigator after the peer runtime is in place.

<PackageManagerTabs command="npm install react-native-screen-transitions" />

## Peer Dependencies

These are the packages the navigators, gestures, screen containers, and animation pipeline rely on.

<PackageManagerTabs command="npm install react-native-reanimated react-native-gesture-handler @react-navigation/native @react-navigation/native-stack @react-navigation/elements react-native-screens react-native-safe-area-context" />

## Optional masking support

If you use reveal-style shared transitions with `Transition.MaskedView`, install masked view support as an extra dependency.

<PackageManagerTabs command="npm install @react-native-masked-view/masked-view" />

This is not required for normal stack transitions, custom interpolators, or snap-point sheets.

## Public Entry Points

The docs and generated API reference only cover the supported public surface. Everything else should be treated as internal.

- `react-native-screen-transitions`
- `react-native-screen-transitions/blank-stack`
- `react-native-screen-transitions/native-stack`
- `react-native-screen-transitions/component-stack`

## Next Steps

Once the dependencies are in place, move straight into a working navigator and then compare the tradeoffs between the available stack surfaces.

- [Build your first navigator →](./quickstart)
- [Compare stack variants →](../stack-variants)
