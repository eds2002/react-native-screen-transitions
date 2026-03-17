---
title: Stack Variants
sidebar_position: 1
---

# Stack Variants

The package exposes three navigator surfaces. They share the same transition ideas, but they solve different problems.

| Variant | Import | Best for | Tradeoff |
| --- | --- | --- | --- |
| Blank Stack | `react-native-screen-transitions/blank-stack` | The default choice for highly custom transitions, sheets, bounds work, and gesture-heavy flows | More responsibility on you to build sensible motion |
| Native Stack | `react-native-screen-transitions/native-stack` | Apps that already live in `@react-navigation/native-stack` but want to layer custom motion on top | Less raw freedom than the JS-first path |
| Component Stack | `react-native-screen-transitions/component-stack` | Embedded flows, floating card stacks, in-screen navigators, and product UI that behaves like a navigator | More bespoke than a normal app shell navigator |

## Recommended default

Start with `blank-stack` if your thought process is: "stock navigation is close, but not close enough."

It is the surface that most clearly reflects what this library is trying to do: give you direct control over motion, layout-driven transitions, and gesture coordination without constantly pushing against the abstraction.

## When to choose `native-stack`

Use `native-stack` when your app is already committed to that mental model and you only want to opt into custom transitions where it matters.

This is usually the better fit when:

- most of your app still wants to feel like a normal navigation stack
- you only need custom motion on a subset of screens
- you want a more incremental path instead of going full JS-first

## When to choose `component-stack`

Use `component-stack` when the navigator itself is part of the product UI, not the global app shell.

Typical examples:

- story viewers
- onboarding flows
- floating music players
- embedded subflows inside a screen

If the transition surface feels more like a widget, card stack, or nested product flow than a top-level app navigator, `component-stack` is usually the right tool.
