[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [native-stack](../README.md) / createNativeStackNavigator

# Function: createNativeStackNavigator()

> **createNativeStackNavigator**\<`ParamList`, `NavigatorID`, `TypeBag`, `Config`\>(`config?`): `TypedNavigator`\<`TypeBag`, `Config`\>

Defined in: [native-stack/navigators/createNativeStackNavigator.tsx:65](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/native-stack/navigators/createNativeStackNavigator.tsx#L65)

## Type Parameters

### ParamList

`ParamList` *extends* `ParamListBase`

### NavigatorID

`NavigatorID` *extends* `string` \| `undefined` = `undefined`

### TypeBag

`TypeBag` *extends* `NavigatorTypeBagBase` = \{ `EventMap`: [`NativeStackNavigationEventMap`](../type-aliases/NativeStackNavigationEventMap.md); `NavigationList`: \{ \[RouteName in string \| number \| symbol\]: NativeStackNavigationProp\<ParamList, RouteName, NavigatorID\> \}; `Navigator`: (`__namedParameters`) => `Element`; `NavigatorID`: `NavigatorID`; `ParamList`: `ParamList`; `ScreenOptions`: [`NativeStackNavigationOptions`](../type-aliases/NativeStackNavigationOptions.md); `State`: `StackNavigationState`\<`ParamList`\>; \}

### Config

`Config` *extends* `StaticConfig`\<`TypeBag`\> = `StaticConfig`\<`TypeBag`\>

## Parameters

### config?

`Config`

## Returns

`TypedNavigator`\<`TypeBag`, `Config`\>
