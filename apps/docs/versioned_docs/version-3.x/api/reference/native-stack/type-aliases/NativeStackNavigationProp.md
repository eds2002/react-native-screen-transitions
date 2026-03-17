[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [native-stack](../README.md) / NativeStackNavigationProp

# Type Alias: NativeStackNavigationProp\<ParamList, RouteName, NavigatorID\>

> **NativeStackNavigationProp**\<`ParamList`, `RouteName`, `NavigatorID`\> = `NavigationProp`\<`ParamList`, `RouteName`, `NavigatorID`, `StackNavigationState`\<`ParamList`\>, [`NativeStackNavigationOptions`](NativeStackNavigationOptions.md), [`NativeStackNavigationEventMap`](NativeStackNavigationEventMap.md)\> & `StackActionHelpers`\<`ParamList`\>

Defined in: native-stack/types.ts:53

## Type Parameters

### ParamList

`ParamList` *extends* `ParamListBase`

### RouteName

`RouteName` *extends* keyof `ParamList` = `string`

### NavigatorID

`NavigatorID` *extends* `string` \| `undefined` = `undefined`
