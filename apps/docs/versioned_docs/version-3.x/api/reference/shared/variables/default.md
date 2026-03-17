[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / default

# Variable: default

> **default**: `object`

Defined in: shared/index.ts:6

## Type Declaration

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

#### Specs.DefaultSpec

> **DefaultSpec**: `SpringConfig`

### View

> **View**: `MemoExoticComponent`\<`ForwardRefExoticComponent`\<`RestProps`\<`ViewProps`\> & `AnimatedStyleProps`\<`ViewProps`\> & `LayoutProps` & `object` & `object` & `RefAttributes`\<`never`\>\>\>
