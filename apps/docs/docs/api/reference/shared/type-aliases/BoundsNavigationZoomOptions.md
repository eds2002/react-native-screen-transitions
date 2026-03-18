[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / BoundsNavigationZoomOptions

# Type Alias: BoundsNavigationZoomOptions

> **BoundsNavigationZoomOptions** = `object`

Defined in: [shared/types/bounds.types.ts:31](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/bounds.types.ts#L31)

## Properties

### anchor?

> `optional` **anchor**: `BoundsAnchor`

Defined in: [shared/types/bounds.types.ts:32](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/bounds.types.ts#L32)

***

### mask?

> `optional` **mask**: `object`

Defined in: [shared/types/bounds.types.ts:35](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/bounds.types.ts#L35)

#### borderBottomLeftRadius?

> `optional` **borderBottomLeftRadius**: `number` \| `"auto"` \| \{ `from?`: `number`; `to?`: `number`; \}

#### borderBottomRightRadius?

> `optional` **borderBottomRightRadius**: `number` \| `"auto"` \| \{ `from?`: `number`; `to?`: `number`; \}

#### borderCurve?

> `optional` **borderCurve**: `"circular"` \| `"continuous"`

#### borderRadius?

> `optional` **borderRadius**: `number` \| `"auto"` \| \{ `from?`: `number`; `to?`: `number`; \}

#### borderTopLeftRadius?

> `optional` **borderTopLeftRadius**: `number` \| `"auto"` \| \{ `from?`: `number`; `to?`: `number`; \}

#### borderTopRightRadius?

> `optional` **borderTopRightRadius**: `number` \| `"auto"` \| \{ `from?`: `number`; `to?`: `number`; \}

#### outset?

> `optional` **outset**: `number` \| \{ `bottom?`: `number`; `left?`: `number`; `right?`: `number`; `top?`: `number`; \}

***

### ~~maskBorderRadius?~~

> `optional` **maskBorderRadius**: `number`

Defined in: [shared/types/bounds.types.ts:53](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/bounds.types.ts#L53)

#### Deprecated

Use `mask.borderRadius` instead.

***

### motion?

> `optional` **motion**: `object`

Defined in: [shared/types/bounds.types.ts:46](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/bounds.types.ts#L46)

#### dragDirectionalScaleMin?

> `optional` **dragDirectionalScaleMin**: `number`

#### dragResistance?

> `optional` **dragResistance**: `number`

***

### scaleMode?

> `optional` **scaleMode**: `BoundsScaleMode`

Defined in: [shared/types/bounds.types.ts:33](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/bounds.types.ts#L33)

***

### target?

> `optional` **target**: `"bound"` \| `"fullscreen"` \| `MeasuredDimensions`

Defined in: [shared/types/bounds.types.ts:34](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/types/bounds.types.ts#L34)
