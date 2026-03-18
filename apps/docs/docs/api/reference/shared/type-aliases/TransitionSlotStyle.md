[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / TransitionSlotStyle

# Type Alias: TransitionSlotStyle

> **TransitionSlotStyle** = [`AnimatedViewStyle`](AnimatedViewStyle.md) \| `TransitionSlotDefinition`

Defined in: [shared/types/animation.types.ts:196](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L196)

A slot in the interpolated style map.

Can be written in two forms:
- **Shorthand**: Write styles directly — `{ opacity: 0.5, transform: [...] }`
- **Explicit**: Use `style` and/or `props` buckets — `{ style: { opacity: 0.5 }, props: { intensity: 80 } }`
