[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / snapTo

# Function: snapTo()

> **snapTo**(`index`): `void`

Defined in: [shared/animation/snap-to.ts:79](https://github.com/eds2002/react-native-screen-transitions/blob/0a86764a47b6f7832cf444be574f082a36db7fac/packages/react-native-screen-transitions/src/shared/animation/snap-to.ts#L79)

Programmatically snap the currently focused screen to a specific snap point.

## Parameters

### index

`number`

The index of the snap point to snap to (0-based, sorted ascending)

## Returns

`void`

## Example

```tsx
import { snapTo } from 'react-native-screen-transitions';

// Snap to the first (smallest) snap point
snapTo(0);

// Snap to the last (largest) snap point
snapTo(2); // if there are 3 snap points
```
