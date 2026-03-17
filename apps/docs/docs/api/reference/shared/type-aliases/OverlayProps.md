[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / OverlayProps

# Type Alias: OverlayProps\<TNavigation\>

> **OverlayProps**\<`TNavigation`\> = `object`

Defined in: [shared/types/overlay.types.ts:21](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/overlay.types.ts#L21)

## Type Parameters

### TNavigation

`TNavigation` = `unknown`

## Properties

### focusedIndex

> **focusedIndex**: `number`

Defined in: [shared/types/overlay.types.ts:30](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/overlay.types.ts#L30)

Index of the focused route in the stack.

***

### focusedRoute

> **focusedRoute**: `Route`\<`string`\>

Defined in: [shared/types/overlay.types.ts:25](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/overlay.types.ts#L25)

Route of the currently focused screen in the stack.

***

### meta?

> `optional` **meta**: `Record`\<`string`, `unknown`\>

Defined in: [shared/types/overlay.types.ts:40](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/overlay.types.ts#L40)

Custom metadata from the focused screen's options.

***

### navigation

> **navigation**: `TNavigation`

Defined in: [shared/types/overlay.types.ts:45](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/overlay.types.ts#L45)

Navigation prop for the overlay.

***

### options

> **options**: [`ScreenTransitionConfig`](ScreenTransitionConfig.md)

Defined in: [shared/types/overlay.types.ts:50](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/overlay.types.ts#L50)

Screen options for the currently focused screen.

***

### progress

> **progress**: `DerivedValue`\<`number`\>

Defined in: [shared/types/overlay.types.ts:56](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/overlay.types.ts#L56)

Stack progress relative to the overlay's position.
This is equivalent to `useScreenAnimation().stackProgress`.

***

### routes

> **routes**: `Route`\<`string`\>[]

Defined in: [shared/types/overlay.types.ts:35](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/overlay.types.ts#L35)

All routes currently in the stack.
