[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [blank-stack](../README.md) / createBlankStackNavigator

# Function: createBlankStackNavigator()

> **createBlankStackNavigator**\<`ParamList`, `NavigatorID`, `TypeBag`, `Config`\>(`config?`): `TypedNavigator`\<`TypeBag`, `Config`\>

Defined in: blank-stack/navigators/create-blank-stack-navigator.tsx:90

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
