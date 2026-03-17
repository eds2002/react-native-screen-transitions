[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / OverlayProps

# Type Alias: OverlayProps\<TNavigation\>

> **OverlayProps**\<`TNavigation`\> = `object`

Defined in: shared/types/overlay.types.ts:20

Props passed to overlay components.
Generic over the navigation type since different stacks have different navigation props.

## Type Parameters

### TNavigation

`TNavigation` = `unknown`

## Properties

### focusedIndex

> **focusedIndex**: `number`

Defined in: shared/types/overlay.types.ts:29

Index of the focused route in the stack.

***

### focusedRoute

> **focusedRoute**: `Route`\<`string`\>

Defined in: shared/types/overlay.types.ts:24

Route of the currently focused screen in the stack.

***

### meta?

> `optional` **meta**: `Record`\<`string`, `unknown`\>

Defined in: shared/types/overlay.types.ts:39

Custom metadata from the focused screen's options.

***

### navigation

> **navigation**: `TNavigation`

Defined in: shared/types/overlay.types.ts:44

Navigation prop for the overlay.

***

### options

> **options**: [`ScreenTransitionConfig`](ScreenTransitionConfig.md)

Defined in: shared/types/overlay.types.ts:49

Screen options for the currently focused screen.

***

### ~~overlayAnimation~~

> **overlayAnimation**: `DerivedValue`\<[`OverlayInterpolationProps`](../interfaces/OverlayInterpolationProps.md)\>

Defined in: shared/types/overlay.types.ts:63

Animation values for the overlay.

#### Deprecated

Use `progress` prop or `useScreenAnimation()` instead.
This prop will be removed in a future version.

***

### progress

> **progress**: `DerivedValue`\<`number`\>

Defined in: shared/types/overlay.types.ts:55

Stack progress relative to the overlay's position.
This is equivalent to `useScreenAnimation().stackProgress`.

***

### routes

> **routes**: `Route`\<`string`\>[]

Defined in: shared/types/overlay.types.ts:34

All routes currently in the stack.

***

### ~~screenAnimation~~

> **screenAnimation**: `DerivedValue`\<[`ScreenInterpolationProps`](../interfaces/ScreenInterpolationProps.md)\>

Defined in: shared/types/overlay.types.ts:71

Animation values for the screen.

#### Deprecated

Use `useScreenAnimation()` hook directly instead.
This prop will be removed in a future version.
