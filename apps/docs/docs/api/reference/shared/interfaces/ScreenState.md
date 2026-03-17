[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / ScreenState

# Interface: ScreenState\<TNavigation\>

Defined in: [shared/hooks/navigation/use-screen-state.ts:13](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L13)

## Type Parameters

### TNavigation

`TNavigation` *extends* `BaseStackNavigation` = `BaseStackNavigation`

## Properties

### focusedIndex

> **focusedIndex**: `number`

Defined in: [shared/hooks/navigation/use-screen-state.ts:39](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L39)

Index of the focused route in the stack.

***

### focusedRoute

> **focusedRoute**: `Route`\<`string`\>

Defined in: [shared/hooks/navigation/use-screen-state.ts:34](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L34)

Route of the currently focused screen in the stack.

***

### index

> **index**: `number`

Defined in: [shared/hooks/navigation/use-screen-state.ts:19](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L19)

The index of this screen in the stack.

***

### meta?

> `optional` **meta**: `Record`\<`string`, `unknown`\>

Defined in: [shared/hooks/navigation/use-screen-state.ts:44](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L44)

Custom metadata from the focused screen's options.

***

### navigation

> **navigation**: `TNavigation`

Defined in: [shared/hooks/navigation/use-screen-state.ts:49](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L49)

Navigation object for this screen.

***

### options

> **options**: [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

Defined in: [shared/hooks/navigation/use-screen-state.ts:24](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L24)

Screen options for the currently focused screen.

***

### routes

> **routes**: `Route`\<`string`\>[]

Defined in: [shared/hooks/navigation/use-screen-state.ts:29](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L29)

All routes currently in the stack.

***

### snapTo()

> **snapTo**: (`index`) => `void`

Defined in: [shared/hooks/navigation/use-screen-state.ts:56](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/navigation/use-screen-state.ts#L56)

Programmatically snap the focused screen to a snap point index.

Scoped to this screen's stack context, avoiding global history ambiguity.

#### Parameters

##### index

`number`

#### Returns

`void`
