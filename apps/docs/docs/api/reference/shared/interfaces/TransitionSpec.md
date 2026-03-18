[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / TransitionSpec

# Interface: TransitionSpec

Defined in: [shared/types/animation.types.ts:260](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L260)

Defines separate animation configurations for screen transitions and snap point changes.

## Properties

### close?

> `optional` **close**: [`AnimationConfig`](../type-aliases/AnimationConfig.md)

Defined in: [shared/types/animation.types.ts:268](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L268)

Animation config for closing/exiting a screen.

***

### collapse?

> `optional` **collapse**: [`AnimationConfig`](../type-aliases/AnimationConfig.md)

Defined in: [shared/types/animation.types.ts:278](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L278)

Animation config for collapsing to a lower snap point.
Uses lower intensity than `close` to match smaller movement distances.

***

### expand?

> `optional` **expand**: [`AnimationConfig`](../type-aliases/AnimationConfig.md)

Defined in: [shared/types/animation.types.ts:273](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L273)

Animation config for expanding to a higher snap point.
Uses lower intensity than `open` to match smaller movement distances.

***

### open?

> `optional` **open**: [`AnimationConfig`](../type-aliases/AnimationConfig.md)

Defined in: [shared/types/animation.types.ts:264](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L264)

Animation config for opening/entering a screen.
