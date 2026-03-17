[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [blank-stack](../README.md) / createBlankStackNavigator

# Function: createBlankStackNavigator()

> **createBlankStackNavigator**\<`ParamList`, `NavigatorID`, `TypeBag`, `Config`\>(`config?`): `TypedNavigator`\<`TypeBag`, `Config`\>

Defined in: [blank-stack/navigators/create-blank-stack-navigator.tsx:64](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/blank-stack/navigators/create-blank-stack-navigator.tsx#L64)

## Type Parameters

### ParamList

`ParamList` *extends* `ParamListBase`

### NavigatorID

`NavigatorID` *extends* `string` \| `undefined` = `undefined`

### TypeBag

`TypeBag` *extends* `NavigatorTypeBagBase` = \{ `EventMap`: [`BlankStackNavigationEventMap`](../type-aliases/BlankStackNavigationEventMap.md); `NavigationList`: \{ \[RouteName in string \| number \| symbol\]: BlankStackNavigationProp\<ParamList, RouteName, NavigatorID\> \}; `Navigator`: (`__namedParameters`) => `Element`; `NavigatorID`: `NavigatorID`; `ParamList`: `ParamList`; `ScreenOptions`: [`BlankStackNavigationOptions`](../type-aliases/BlankStackNavigationOptions.md); `State`: `StackNavigationState`\<`ParamList`\>; \}

### Config

`Config` *extends* `StaticConfig`\<`TypeBag`\> = `StaticConfig`\<`TypeBag`\>

## Parameters

### config?

`Config`

## Returns

`TypedNavigator`\<`TypeBag`, `Config`\>
