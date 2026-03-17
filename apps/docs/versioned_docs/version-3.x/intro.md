---
title: Docs Overview
sidebar_position: 1
---

# react-native-screen-transitions

`react-native-screen-transitions` now treats documentation as product surface, not afterthought.

This site is organized around three maintenance lanes:

- Handwritten guides for setup, mental models, migration, and recipes
- Generated API reference from the package's public TypeScript entrypoints
- Versioned docs snapshots for stable release lines, with a separate `Next` lane for unreleased work

## What this library is for

Use this library when you need transition behavior that sits above platform defaults:

- Gesture-driven pushes, cards, drawers, and sheets
- Shared element and bounds-based transitions
- Backdrop and surface layers with animated styles or props
- Stack-level progress and route-aware interpolation logic
- Prebuilt presets you can use directly or treat as starting points

If you only want platform-native push/pop behavior with minimal customization, `@react-navigation/native-stack` is still the simpler choice.

## Where to start

- New to the package: go to [Installation](./getting-started/installation.md) and [Quickstart](./getting-started/quickstart.md)
- Designing custom motion: go to [Core Mental Model](./core-mental-model/index.md)
- Picking a navigator surface: go to [Stack Variants](./stack-variants/index.md)
- Looking for concrete scenarios: go to [Recipes](./recipes/index.md)

## Release policy

This docs site intentionally exposes only two lanes:

- `3.x`: the latest stable line
- `Next`: unreleased alpha, beta, and rc work

That keeps the docs accurate without freezing a new site for every prerelease tag.
