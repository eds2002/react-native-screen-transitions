---
title: Stack Variants
sidebar_position: 1
---

# Stack Variants

The package exposes three navigator surfaces. Pick the one that matches the amount of control you need.

| Variant | Import | Best for | Tradeoff |
| --- | --- | --- | --- |
| Native Stack | `react-native-screen-transitions/native-stack` | Starting from `@react-navigation/native-stack` while layering custom transitions and bounds behavior on top | Less raw freedom than the JS-first stacks |
| Blank Stack | `react-native-screen-transitions/blank-stack` | Full control over transition behavior, gesture handling, sheets, and custom layers | More responsibility on you to design good defaults |
| Component Stack | `react-native-screen-transitions/component-stack` | Embedded flows, floating card-style stacks, and non-router transition surfaces | More bespoke than a conventional app-wide navigator |

## Recommended default

Start with `blank-stack` if your goal is "I need this package because stock navigation is not enough anymore."

Use `native-stack` if you want to preserve more of the native-stack mental model and only opt into custom motion where needed.

Use `component-stack` when the transition surface is a product UI element in its own right, like:

- story viewers
- onboarding flows
- floating music players
- embedded subflows inside a screen

The repository demo app includes dedicated component-stack scenarios such as `music-player`, `story-viewer`, `embedded-flow`, and `size-transitions`.
