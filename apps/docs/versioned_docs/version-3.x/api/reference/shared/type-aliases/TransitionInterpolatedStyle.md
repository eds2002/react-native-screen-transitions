[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / TransitionInterpolatedStyle

# Type Alias: TransitionInterpolatedStyle

> **TransitionInterpolatedStyle** = `object`

Defined in: shared/types/animation.types.ts:188

## Indexable

\[`id`: `string`\]: `StyleProps` \| `undefined`

Define your own custom styles by using an id as the key: [id]: StyleProps

## Properties

### backdropStyle?

> `optional` **backdropStyle**: `StyleProps`

Defined in: shared/types/animation.types.ts:203

Animated style for the semi-transparent backdrop layer behind screen content.

#### Example

```ts
backdropStyle: {
  backgroundColor: "black",
  opacity: interpolate(progress, [0, 1], [0, 0.5]),
}
```

***

### contentStyle?

> `optional` **contentStyle**: `StyleProps`

Defined in: shared/types/animation.types.ts:192

Animated style for the main screen view. Styles are only applied when Transition.View is present.

***

### ~~overlayStyle?~~

> `optional` **overlayStyle**: `StyleProps`

Defined in: shared/types/animation.types.ts:208

#### Deprecated

Use `backdropStyle` instead. Will be removed in next major version.
