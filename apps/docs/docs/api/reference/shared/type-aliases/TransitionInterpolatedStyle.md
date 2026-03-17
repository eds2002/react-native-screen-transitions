[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / TransitionInterpolatedStyle

# Type Alias: TransitionInterpolatedStyle

> **TransitionInterpolatedStyle** = `object`

Defined in: [shared/types/animation.types.ts:226](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L226)

The return type of `screenStyleInterpolator`.
Uses the nested slot format, while still accepting deprecated flat keys.

## Indexable

\[`id`: `string`\]: [`TransitionSlotStyle`](TransitionSlotStyle.md) \| `undefined`

Custom styles/props by id for Transition.View components.

## Properties

### backdrop?

> `optional` **backdrop**: [`TransitionSlotStyle`](TransitionSlotStyle.md)

Defined in: [shared/types/animation.types.ts:230](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L230)

Animated style and props for the backdrop layer between screens.

***

### ~~backdropStyle?~~

> `optional` **backdropStyle**: [`AnimatedViewStyle`](AnimatedViewStyle.md)

Defined in: [shared/types/animation.types.ts:244](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L244)

#### Deprecated

Use `backdrop` instead.
This flat format is auto-converted via a backward-compat shim.

***

### content?

> `optional` **content**: [`TransitionSlotStyle`](TransitionSlotStyle.md)

Defined in: [shared/types/animation.types.ts:228](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L228)

Animated style and props for the main screen content view.

***

### ~~contentStyle?~~

> `optional` **contentStyle**: [`AnimatedViewStyle`](AnimatedViewStyle.md)

Defined in: [shared/types/animation.types.ts:239](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L239)

#### Deprecated

Use `content` instead.
This flat format is auto-converted via a backward-compat shim.

***

### ~~overlayStyle?~~

> `optional` **overlayStyle**: [`AnimatedViewStyle`](AnimatedViewStyle.md)

Defined in: [shared/types/animation.types.ts:249](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L249)

#### Deprecated

Use `backdrop` instead.
This flat format is auto-converted via a backward-compat shim.

***

### surface?

> `optional` **surface**: [`TransitionSlotStyle`](TransitionSlotStyle.md)

Defined in: [shared/types/animation.types.ts:232](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L232)

Animated style and props for the surface component layer within the screen.
