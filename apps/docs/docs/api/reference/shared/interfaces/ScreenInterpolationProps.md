[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / ScreenInterpolationProps

# Interface: ScreenInterpolationProps

Defined in: [shared/types/animation.types.ts:82](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L82)

## Properties

### active

> **active**: `ScreenTransitionState`

Defined in: [shared/types/animation.types.ts:161](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L161)

The screen state that is currently driving the transition (either current or next, whichever is focused).

***

### bounds

> **bounds**: `BoundsAccessor`

Defined in: [shared/types/animation.types.ts:156](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L156)

Function that provides access to bounds helpers for shared screen transitions.

***

### current

> **current**: `ScreenTransitionState`

Defined in: [shared/types/animation.types.ts:91](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L91)

Values for the current screen being interpolated.

***

### focused

> **focused**: `boolean`

Defined in: [shared/types/animation.types.ts:123](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L123)

Whether the current screen is the focused (topmost) screen in the stack.

***

### inactive

> **inactive**: `ScreenTransitionState` \| `undefined`

Defined in: [shared/types/animation.types.ts:167](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L167)

The screen state that is NOT driving the transition.
When focused, this is the previous screen. When not focused, this is the current screen.

***

### insets

> **insets**: `EdgeInsets`

Defined in: [shared/types/animation.types.ts:118](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L118)

The safe area insets for the screen.

***

### layouts

> **layouts**: `object`

Defined in: [shared/types/animation.types.ts:101](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L101)

Layout measurements for the screen.

#### content?

> `optional` **content**: `Layout`

The intrinsic measured content wrapper layout when available.

This is currently populated for the measured screen-container path used by
auto snap-point sizing. It is undefined until a real measurement exists.

#### screen

> **screen**: `Layout`

The `width` and `height` of the screen container.

***

### next

> **next**: `ScreenTransitionState` \| `undefined`

Defined in: [shared/types/animation.types.ts:96](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L96)

Values for the screen that comes after the current one in the navigation stack.

***

### previous

> **previous**: `ScreenTransitionState` \| `undefined`

Defined in: [shared/types/animation.types.ts:86](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L86)

Values for the screen that came before the current one in the navigation stack.

***

### progress

> **progress**: `number`

Defined in: [shared/types/animation.types.ts:128](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L128)

Combined progress of current and next screen transitions, ranging from 0-2.

***

### snapIndex

> **snapIndex**: `number`

Defined in: [shared/types/animation.types.ts:151](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L151)

Animated index of the current snap point.
Interpolates between indices during gestures/animations.
- Returns -1 if no snap points are defined
- Returns 0 when at or below first snap point
- Returns fractional values between snap points (e.g., 1.5 = halfway between snap 1 and 2)
- Returns length-1 when at or above last snap point

***

### stackProgress

> **stackProgress**: `number`

Defined in: [shared/types/animation.types.ts:141](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/animation.types.ts#L141)

Accumulated progress from the current screen's position onwards in the stack.
Unlike `progress` (0-2), this ranges from 0-N where N is the number of screens
above the current screen. Each screen at index I sees stackProgress as the
sum of all progress values from index I to the top of the stack.

Example: With 4 screens pushed, screen at index 1 would see stackProgress = 3
when all screens are fully transitioned.

Falls back to `progress` when not in blank-stack.
