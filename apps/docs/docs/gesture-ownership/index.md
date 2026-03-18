---
title: Gesture Ownership
sidebar_position: 2
---

# Gesture Ownership

Gesture ownership answers one question:

Who owns this drag direction right now?

Ownership is resolved from the current screen outward through the gesture tree. It is not a global "who has gestures enabled" flag, and it is not shared across all directions.

## Core principles

The runtime follows these rules:

- gestures dismiss stacks, not isolated screens in a vacuum
- ownership is per direction
- child claims shadow ancestors for the same direction
- if the current screen does not claim a direction, the runtime walks up the tree

The four directions are independent:

- `vertical`
- `vertical-inverted`
- `horizontal`
- `horizontal-inverted`

That means:

- vertical and horizontal never interfere
- `vertical` and `vertical-inverted` are different claims
- `horizontal` and `horizontal-inverted` are different claims

## Direction reference

| Direction | Drag motion | Typical use |
| --- | --- | --- |
| `vertical` | top to bottom | bottom-sheet collapse or downward dismiss |
| `vertical-inverted` | bottom to top | top-sheet collapse or upward dismiss |
| `horizontal` | left to right | right-edge dismiss |
| `horizontal-inverted` | right to left | left-edge dismiss |

## What counts as a claim

A screen claims a direction when:

- `gestureEnabled` is on
- `gestureDirection` includes that direction

There are two important expansions of that rule:

- `gestureDirection="bidirectional"` claims all four directions
- `snapPoints` automatically claim both directions on the configured axis

That second point matters a lot. A bottom sheet configured with `gestureDirection: "vertical"` does not just claim `vertical`. Once `snapPoints` exist, it also claims `vertical-inverted` so it can expand and collapse on the same axis.

## Resolution order

For any drag direction:

1. If the current screen claims it, ownership is `self`
2. Otherwise the runtime walks ancestors until it finds a claim
3. If nobody claims it, ownership is `none`

That is the actual runtime shape used by the ownership resolver. The runtime precomputes that ownership per direction before the gesture worklets run, so touch handling can make a fast yes or no decision later.

## Shadowing

Shadowing happens when a child claims the same direction as an ancestor.

When that happens:

- the child owns that direction
- the ancestor is blocked for that direction
- other directions can still be inherited independently

This is what makes nested stacks predictable instead of globally conflicting.

The current branch also pre-registers child claims so ancestors can fail early instead of half-starting their own pan first. That is why shadowed gestures feel crisp instead of delayed.

## Same axis, different directions can coexist

Two screens can coexist on the same axis if they claim different directions.

Example:

- parent claims `vertical-inverted`
- child claims `vertical`

That is not a conflict. Each direction still resolves independently.

## Snap points change ownership

Once a screen has `snapPoints`, it claims both directions on its axis.

Examples:

- a bottom sheet claims `vertical` and `vertical-inverted`
- a right drawer claims `horizontal` and `horizontal-inverted`

That is what lets a sheet both expand and collapse.

This also means a snap sheet can shadow an ancestor for one entire axis while still inheriting a different axis from somewhere higher in the tree.

## What dismissal means

When a screen owns a direction, the dismissal action targets that owner's stack.

So:

- a leaf can dismiss itself
- a nested layout can dismiss its whole branch
- a child that shadows a parent prevents the parent from handling that same direction

This is why the ownership system has to be understood at the stack level.

## Resolution examples

### Parent owns one direction

- parent layout claims `vertical`
- current leaf claims nothing
- dragging down dismisses the parent branch

### Child shadows parent

- parent layout claims `vertical`
- child leaf also claims `vertical`
- dragging down dismisses only the child

### Different directions coexist

- parent claims `vertical-inverted`
- child claims `vertical`
- dragging up resolves to the parent
- dragging down resolves to the child

### Snap sheet shadows one axis and inherits another

- parent layout claims `vertical`
- child sheet has `snapPoints` and `gestureDirection="horizontal"`
- the sheet owns `horizontal` and `horizontal-inverted`
- the parent still owns `vertical`

## Source routes to study

- `gestures/simple-inheritance`
- `gestures/coexistence`
- `gestures/same-axis-shadowing`
- `gestures/deep-nesting`
- `gestures/snap-deep-nesting`
