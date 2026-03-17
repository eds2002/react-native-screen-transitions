[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [blank-stack](../README.md) / BlankStackNavigationOptions

# Type Alias: BlankStackNavigationOptions

> **BlankStackNavigationOptions** = `BlankStackScreenTransitionConfig` & `object`

Defined in: blank-stack/types.ts:75

## Type Declaration

### freezeOnBlur?

> `optional` **freezeOnBlur**: `boolean`

Whether inactive screens should be suspended from re-rendering. Defaults to `false`.
Defaults to `true` when `enableFreeze()` is run at the top of the application.
Requires `react-native-screens` version >=3.16.0.

Only supported on iOS and Android.
