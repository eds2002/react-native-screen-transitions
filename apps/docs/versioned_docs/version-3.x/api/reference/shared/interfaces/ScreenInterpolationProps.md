[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / ScreenInterpolationProps

# Interface: ScreenInterpolationProps

Defined in: shared/types/animation.types.ts:85

## Properties

### active

> **active**: `ScreenTransitionState`

Defined in: shared/types/animation.types.ts:163

The screen state that is currently driving the transition (either current or next, whichever is focused).

***

### ~~activeBoundId?~~

> `optional` **activeBoundId**: `undefined`

Defined in: shared/types/animation.types.ts:120

The ID of the currently active shared bound (e.g., 'a' when Transition.Pressable has sharedBoundTag='a').

#### Deprecated

***

### bounds

> **bounds**: `BoundsAccessor`

Defined in: shared/types/animation.types.ts:158

Function that provides access to bounds builders for creating shared element transitions.

***

### current

> **current**: `ScreenTransitionState`

Defined in: shared/types/animation.types.ts:94

Values for the current screen being interpolated.

***

### focused

> **focused**: `boolean`

Defined in: shared/types/animation.types.ts:125

Whether the current screen is the focused (topmost) screen in the stack.

***

### inactive

> **inactive**: `ScreenTransitionState` \| `undefined`

Defined in: shared/types/animation.types.ts:169

The screen state that is NOT driving the transition.
When focused, this is the previous screen. When not focused, this is the current screen.

***

### insets

> **insets**: `EdgeInsets`

Defined in: shared/types/animation.types.ts:114

The safe area insets for the screen.

***

### ~~isActiveTransitioning~~

> **isActiveTransitioning**: `boolean`

Defined in: shared/types/animation.types.ts:175

Whether the active screen is currently transitioning (either being dragged or animating).

#### Deprecated

Use `active.animating` instead.

***

### ~~isDismissing~~

> **isDismissing**: `boolean`

Defined in: shared/types/animation.types.ts:181

Whether the active screen is in the process of being dismissed/closed.

#### Deprecated

Use `active.closing` instead.

***

### layouts

> **layouts**: `object`

Defined in: shared/types/animation.types.ts:104

Layout measurements for the screen.

#### screen

> **screen**: `Layout`

The `width` and `height` of the screen container.

***

### next

> **next**: `ScreenTransitionState` \| `undefined`

Defined in: shared/types/animation.types.ts:99

Values for the screen that comes after the current one in the navigation stack.

***

### previous

> **previous**: `ScreenTransitionState` \| `undefined`

Defined in: shared/types/animation.types.ts:89

Values for the screen that came before the current one in the navigation stack.

***

### progress

> **progress**: `number`

Defined in: shared/types/animation.types.ts:130

Combined progress of current and next screen transitions, ranging from 0-2.

***

### snapIndex

> **snapIndex**: `number`

Defined in: shared/types/animation.types.ts:153

Animated index of the current snap point.
Interpolates between indices during gestures/animations.
- Returns -1 if no snap points are defined
- Returns 0 when at or below first snap point
- Returns fractional values between snap points (e.g., 1.5 = halfway between snap 1 and 2)
- Returns length-1 when at or above last snap point

***

### stackProgress

> **stackProgress**: `number`

Defined in: shared/types/animation.types.ts:143

Accumulated progress from the current screen's position onwards in the stack.
Unlike `progress` (0-2), this ranges from 0-N where N is the number of screens
above the current screen. Each screen at index I sees stackProgress as the
sum of all progress values from index I to the top of the stack.

Example: With 4 screens pushed, screen at index 1 would see stackProgress = 3
when all screens are fully transitioned.

Falls back to `progress` when not in blank-stack.
