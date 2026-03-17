[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [component-stack](../README.md) / ComponentStackScreenProps

# Type Alias: ComponentStackScreenProps\<ParamList, RouteName, NavigatorID\>

> **ComponentStackScreenProps**\<`ParamList`, `RouteName`, `NavigatorID`\> = `object`

Defined in: component-stack/types.ts:32

## Type Parameters

### ParamList

`ParamList` *extends* `ParamListBase`

### RouteName

`RouteName` *extends* keyof `ParamList` = `string`

### NavigatorID

`NavigatorID` *extends* `string` \| `undefined` = `undefined`

## Properties

### navigation

> **navigation**: [`ComponentStackNavigationProp`](ComponentStackNavigationProp.md)\<`ParamList`, `RouteName`, `NavigatorID`\>

Defined in: component-stack/types.ts:37

***

### route

> **route**: `RouteProp`\<`ParamList`, `RouteName`\>

Defined in: component-stack/types.ts:38
