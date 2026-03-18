[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [component-stack](../README.md) / createComponentStackNavigator

# Function: createComponentStackNavigator()

> **createComponentStackNavigator**\<`ParamList`, `NavigatorID`, `TypeBag`, `Config`\>(`config?`): `TypedNavigator`\<`TypeBag`, `Config`\>

Defined in: [component-stack/navigators/create-component-stack-navigator.tsx:98](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/component-stack/navigators/create-component-stack-navigator.tsx#L98)

## Type Parameters

### ParamList

`ParamList` *extends* `ParamListBase`

### NavigatorID

`NavigatorID` *extends* `string` \| `undefined` = `undefined`

### TypeBag

`TypeBag` *extends* `NavigatorTypeBagBase` = \{ `EventMap`: [`ComponentStackNavigationEventMap`](../type-aliases/ComponentStackNavigationEventMap.md); `NavigationList`: \{ \[RouteName in string \| number \| symbol\]: ComponentStackNavigationProp\<ParamList, RouteName, NavigatorID\> \}; `Navigator`: (`props`) => `Element`; `NavigatorID`: `NavigatorID`; `ParamList`: `ParamList`; `ScreenOptions`: [`ComponentStackNavigationOptions`](../type-aliases/ComponentStackNavigationOptions.md); `State`: `StackNavigationState`\<`ParamList`\>; \}

### Config

`Config` *extends* `StaticConfig`\<`TypeBag`\> = `StaticConfig`\<`TypeBag`\>

## Parameters

### config?

`Config`

## Returns

`TypedNavigator`\<`TypeBag`, `Config`\>
