[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [native-stack](../README.md) / NativeStackScreenProps

# Type Alias: NativeStackScreenProps\<ParamList, RouteName, NavigatorID\>

> **NativeStackScreenProps**\<`ParamList`, `RouteName`, `NavigatorID`\> = `object`

Defined in: native-stack/types.ts:67

## Type Parameters

### ParamList

`ParamList` *extends* `ParamListBase`

### RouteName

`RouteName` *extends* keyof `ParamList` = `string`

### NavigatorID

`NavigatorID` *extends* `string` \| `undefined` = `undefined`

## Properties

### navigation

> **navigation**: [`NativeStackNavigationProp`](NativeStackNavigationProp.md)\<`ParamList`, `RouteName`, `NavigatorID`\>

Defined in: native-stack/types.ts:72

***

### route

> **route**: `RouteProp`\<`ParamList`, `RouteName`\>

Defined in: native-stack/types.ts:73
