[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / ScreenState

# Interface: ScreenState\<TNavigation\>

Defined in: shared/hooks/navigation/use-screen-state.tsx:13

## Type Parameters

### TNavigation

`TNavigation` *extends* `BaseStackNavigation` = `BaseStackNavigation`

## Properties

### focusedIndex

> **focusedIndex**: `number`

Defined in: shared/hooks/navigation/use-screen-state.tsx:39

Index of the focused route in the stack.

***

### focusedRoute

> **focusedRoute**: `Route`\<`string`\>

Defined in: shared/hooks/navigation/use-screen-state.tsx:34

Route of the currently focused screen in the stack.

***

### index

> **index**: `number`

Defined in: shared/hooks/navigation/use-screen-state.tsx:19

The index of this screen in the stack.

***

### meta?

> `optional` **meta**: `Record`\<`string`, `unknown`\>

Defined in: shared/hooks/navigation/use-screen-state.tsx:44

Custom metadata from the focused screen's options.

***

### navigation

> **navigation**: `TNavigation`

Defined in: shared/hooks/navigation/use-screen-state.tsx:49

Navigation object for this screen.

***

### options

> **options**: [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

Defined in: shared/hooks/navigation/use-screen-state.tsx:24

Screen options for the currently focused screen.

***

### routes

> **routes**: `Route`\<`string`\>[]

Defined in: shared/hooks/navigation/use-screen-state.tsx:29

All routes currently in the stack.

***

### snapTo()

> **snapTo**: (`index`) => `void`

Defined in: shared/hooks/navigation/use-screen-state.tsx:56

Programmatically snap the focused screen to a snap point index.

Scoped to this screen's stack context, avoiding global history ambiguity.

#### Parameters

##### index

`number`

#### Returns

`void`
