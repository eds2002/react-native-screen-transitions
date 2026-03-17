[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [native-stack](../README.md) / NativeStackNavigationEventMap

# Type Alias: NativeStackNavigationEventMap

> **NativeStackNavigationEventMap** = `object`

Defined in: native-stack/types.ts:29

## Properties

### gestureCancel

> **gestureCancel**: `object`

Defined in: native-stack/types.ts:41

Event which fires when a swipe back is canceled on iOS.

#### data

> **data**: `undefined`

***

### sheetDetentChange

> **sheetDetentChange**: `object`

Defined in: native-stack/types.ts:50

Event which fires when screen is in sheet presentation & it's detent changes.

In payload it caries two fields:

* `index` - current detent index in the `sheetAllowedDetents` array,
* `stable` - on Android `false` value means that the user is dragging the sheet or it is settling; on iOS it is always `true`.

#### data

> **data**: `object`

##### data.index

> **index**: `number`

##### data.stable

> **stable**: `boolean`

***

### transitionEnd

> **transitionEnd**: `object`

Defined in: native-stack/types.ts:37

Event which fires when a transition animation ends.

#### data

> **data**: `object`

##### data.closing

> **closing**: `boolean`

***

### transitionStart

> **transitionStart**: `object`

Defined in: native-stack/types.ts:33

Event which fires when a transition animation starts.

#### data

> **data**: `object`

##### data.closing

> **closing**: `boolean`
