[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / TransitionSpec

# Interface: TransitionSpec

Defined in: shared/types/animation.types.ts:224

Defines separate animation configurations for screen transitions and snap point changes.

## Properties

### close?

> `optional` **close**: [`AnimationConfig`](../type-aliases/AnimationConfig.md)

Defined in: shared/types/animation.types.ts:232

Animation config for closing/exiting a screen.

***

### collapse?

> `optional` **collapse**: [`AnimationConfig`](../type-aliases/AnimationConfig.md)

Defined in: shared/types/animation.types.ts:242

Animation config for collapsing to a lower snap point.
Uses lower intensity than `close` to match smaller movement distances.

***

### expand?

> `optional` **expand**: [`AnimationConfig`](../type-aliases/AnimationConfig.md)

Defined in: shared/types/animation.types.ts:237

Animation config for expanding to a higher snap point.
Uses lower intensity than `open` to match smaller movement distances.

***

### open?

> `optional` **open**: [`AnimationConfig`](../type-aliases/AnimationConfig.md)

Defined in: shared/types/animation.types.ts:228

Animation config for opening/entering a screen.
