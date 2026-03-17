[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / snapTo

# Function: snapTo()

> **snapTo**(`index`): `void`

Defined in: shared/animation/snap-to.ts:68

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
