[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / default

# Variable: default

> **default**: `object`

Defined in: [shared/index.ts:10](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/index.ts#L10)

## Type Declaration

### Boundary

> **Boundary**: `object`

Shared-boundary components.

How measurement works:
1. Source screen captures bounds for a tag.
2. Destination screen captures bounds for the same tag.
3. The link is updated as layout changes (group-active + scroll-settled paths).

Press behavior:
- When a boundary has `onPress` (typically `Boundary.Pressable`), source
  measurement runs before the user callback. This gives navigation transitions
  fresh source geometry on the first frame.

Use:
- `Boundary.View` for passive/shared elements.
- `Boundary.Pressable` for tappable elements that start navigation.

#### Boundary.createBoundaryComponent()

> **createBoundaryComponent**: \<`P`\>(`Wrapped`) => `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`Omit`\<`P`, `"id"`\> & `BoundaryOwnProps` & `RefAttributes`\<`ComponentRef`\<`ComponentType`\<`P`\>\>\>\>\>

Factory for custom boundary wrappers.

##### Type Parameters

###### P

`P` *extends* `object`

##### Parameters

###### Wrapped

`ComponentType`\<`P`\>

##### Returns

`MemoExoticComponent`\<`ForwardRefExoticComponent`\<`Omit`\<`P`, `"id"`\> & `BoundaryOwnProps` & `RefAttributes`\<`ComponentRef`\<`ComponentType`\<`P`\>\>\>\>\>

#### Boundary.Pressable

> **Pressable**: `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`Omit`\<`PressableProps` & `RefAttributes`\<`View`\>, `"id"`\> & `BoundaryOwnProps` & `RefAttributes`\<`View` \| `Component`\<`PressableProps` & `RefAttributes`\<`View`\>, `any`, `any`\>\>\>\> = `BoundaryPressable`

Pressable boundary wrapper with press-priority source capture.

#### Boundary.View

> **View**: `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`Omit`\<`ViewProps`, `"id"`\> & `BoundaryOwnProps` & `RefAttributes`\<`never`\>\>\> = `BoundaryView`

Passive boundary wrapper (no built-in press semantics).

### createBoundaryComponent()

> **createBoundaryComponent**: \<`P`\>(`Wrapped`) => `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`Omit`\<`P`, `"id"`\> & `BoundaryOwnProps` & `RefAttributes`\<`ComponentRef`\<`ComponentType`\<`P`\>\>\>\>\>

#### Type Parameters

##### P

`P` *extends* `object`

#### Parameters

##### Wrapped

`ComponentType`\<`P`\>

#### Returns

`MemoExoticComponent`\<`ForwardRefExoticComponent`\<`Omit`\<`P`, `"id"`\> & `BoundaryOwnProps` & `RefAttributes`\<`ComponentRef`\<`ComponentType`\<`P`\>\>\>\>\>

### createTransitionAwareComponent()

> **createTransitionAwareComponent**: \<`P`\>(`Wrapped`, `options`) => `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`RestProps`\<`P`\> & `AnimatedStyleProps`\<`P`\> & `LayoutProps` & `object` & `object` & `RefAttributes`\<`ComponentRef`\<`ComponentType`\<`P`\>\>\>\>\>

#### Type Parameters

##### P

`P` *extends* `object`

#### Parameters

##### Wrapped

`ComponentType`\<`P`\>

##### options?

`CreateTransitionAwareComponentOptions` = `{}`

#### Returns

`MemoExoticComponent`\<`ForwardRefExoticComponent`\<`RestProps`\<`P`\> & `AnimatedStyleProps`\<`P`\> & `LayoutProps` & `object` & `object` & `RefAttributes`\<`ComponentRef`\<`ComponentType`\<`P`\>\>\>\>\>

### FlatList

> **FlatList**: `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`RestProps`\<`FlatListProps`\<`unknown`\>\> & `AnimatedStyleProps`\<`FlatListProps`\<`unknown`\>\> & `LayoutProps` & `object` & `object` & `RefAttributes`\<`never`\>\>\>

### MaskedView()

> **MaskedView**: (`__namedParameters`) => `string` \| `number` \| `bigint` \| `boolean` \| `Iterable`\<`ReactNode`, `any`, `any`\> \| `Promise`\<`AwaitedReactNode`\> \| `Element` \| `null` \| `undefined`

#### Parameters

##### \_\_namedParameters

###### children

`ReactNode`

###### style?

`StyleProp`\<`ViewStyle`\> = `{}`

#### Returns

`string` \| `number` \| `bigint` \| `boolean` \| `Iterable`\<`ReactNode`, `any`, `any`\> \| `Promise`\<`AwaitedReactNode`\> \| `Element` \| `null` \| `undefined`

### Presets

> **Presets**: `object`

#### Presets.DraggableCard()

> **DraggableCard**: (`config`) => [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

##### Parameters

###### config?

`Partial`\<[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)\> = `{}`

##### Returns

[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

#### Presets.ElasticCard()

> **ElasticCard**: (`config`) => [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

##### Parameters

###### config?

`Partial`\<[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)\> & `object` = `...`

##### Returns

[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

#### Presets.SharedAppleMusic()

> **SharedAppleMusic**: (`__namedParameters`) => [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

##### Parameters

###### \_\_namedParameters

`Partial`\<[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)\> & `object`

##### Returns

[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

#### Presets.SharedIGImage()

> **SharedIGImage**: (`__namedParameters`) => [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

##### Parameters

###### \_\_namedParameters

`Partial`\<[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)\> & `object`

##### Returns

[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

#### Presets.SharedXImage()

> **SharedXImage**: (`__namedParameters`) => [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

##### Parameters

###### \_\_namedParameters

`Partial`\<[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)\> & `object`

##### Returns

[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

#### Presets.SlideFromBottom()

> **SlideFromBottom**: (`config`) => [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

##### Parameters

###### config?

`Partial`\<[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)\> = `{}`

##### Returns

[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

#### Presets.SlideFromTop()

> **SlideFromTop**: (`config`) => [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

##### Parameters

###### config?

`Partial`\<[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)\> = `{}`

##### Returns

[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

#### Presets.ZoomIn()

> **ZoomIn**: (`config`) => [`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

##### Parameters

###### config?

`Partial`\<[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)\> = `{}`

##### Returns

[`ScreenTransitionConfig`](../type-aliases/ScreenTransitionConfig.md)

### Pressable

> **Pressable**: `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`RestProps`\<`PressableProps` & `RefAttributes`\<`View`\>\> & `AnimatedStyleProps`\<`PressableProps` & `RefAttributes`\<`View`\>\> & `LayoutProps` & `object` & `object` & `RefAttributes`\<`View` \| `Component`\<`PressableProps` & `RefAttributes`\<`View`\>, `any`, `any`\>\>\>\>

### ScrollView

> **ScrollView**: `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`RestProps`\<`ScrollViewProps`\> & `AnimatedStyleProps`\<`ScrollViewProps`\> & `LayoutProps` & `object` & `object` & `RefAttributes`\<`never`\>\>\>

### Specs

> **Specs**: `object`

#### Specs.DefaultSnapSpec

> **DefaultSnapSpec**: `SpringConfig`

#### Specs.DefaultSpec

> **DefaultSpec**: `SpringConfig`

#### Specs.FlingSpec

> **FlingSpec**: `SpringConfig`

### View

> **View**: `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`RestProps`\<`ViewProps`\> & `AnimatedStyleProps`\<`ViewProps`\> & `LayoutProps` & `object` & `object` & `RefAttributes`\<`never`\>\>\>
