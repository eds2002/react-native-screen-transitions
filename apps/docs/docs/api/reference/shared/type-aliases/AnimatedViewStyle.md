[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / AnimatedViewStyle

# Type Alias: AnimatedViewStyle

> **AnimatedViewStyle** = `ViewStyle` & `TextStyle`

Defined in: [shared/types/animation.types.ts:180](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L180)

Animated style properties with full autocomplete.

Uses React Native's `ViewStyle & TextStyle` instead of Reanimated's `StyleProps`
(which has `[key: string]: any`) so TypeScript can provide autocomplete and catch typos.
