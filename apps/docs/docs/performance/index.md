---
title: Performance Notes
sidebar_position: 2
---

# Performance Notes

This library is fast, but it is not free.

If you choose a JS-first transition system, you are choosing control over raw native efficiency. That is the right tradeoff for a lot of products, but it still needs to be respected.

## The honest baseline

- `native-stack` will still win on raw native performance
- `blank-stack` should be in the same general performance conversation as React Navigation's JS stack
- the biggest bottleneck is usually your own screen cost, not the transition system by itself

## What tends to hurt first

The common performance problems are usually:

- expensive screen trees
- animating width and height aggressively
- over-measuring or over-styling complex layouts
- trying to make every screen transition do too much at once

Width and height animation in particular can feel very different on Android versus iOS. That is not a docs footnote. It is a real product consideration.

## Platform respect matters

Good transition design still means building with each OS in mind.

What feels smooth and elegant on iOS can feel heavy on Android if the properties, timing, or layout behavior are wrong. If an effect starts fighting the platform, simplify it.

## Bounds and gesture-heavy screens

`3.4` adds a lot more power around:

- `Transition.Boundary`
- navigation zoom
- slot-based interpolators
- nested gesture coordination
- auto snap points

That power is worth it, but it also means you should be deliberate about where you use the most expensive patterns.

## Use the benchmark

The repo includes a benchmark surface under `stack-benchmark/*`.

Use it when you want a sanity check between different implementations or when you are trying to understand whether the real cost is:

- your screen composition
- your animation properties
- or the stack surface itself

## Practical rule

Do not optimize for theoretical purity. Optimize for transitions that feel good in the product on both platforms without becoming fragile or expensive to maintain.
