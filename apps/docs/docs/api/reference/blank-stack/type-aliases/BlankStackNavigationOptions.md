[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [blank-stack](../README.md) / BlankStackNavigationOptions

# Type Alias: BlankStackNavigationOptions

> **BlankStackNavigationOptions** = `BlankStackScreenTransitionConfig` & `object`

Defined in: [blank-stack/types.ts:75](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/blank-stack/types.ts#L75)

## Type Declaration

### freezeOnBlur?

> `optional` **freezeOnBlur**: `boolean`

Whether inactive screens should be suspended from re-rendering. Defaults to `false`.
Defaults to `true` when `enableFreeze()` is run at the top of the application.
Requires `react-native-screens` version >=3.16.0.

Only supported on iOS and Android.
