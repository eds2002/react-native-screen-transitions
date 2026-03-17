[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / useScreenGesture

# Function: useScreenGesture()

> **useScreenGesture**(): `MutableRefObject`\<`GestureType` \| `undefined`\> \| `null`

Defined in: shared/hooks/gestures/use-screen-gesture.ts:16

Returns a ref to the screen's navigation pan gesture.
Use this to coordinate child gestures with the navigation gesture.

## Returns

`MutableRefObject`\<`GestureType` \| `undefined`\> \| `null`

## Example

```tsx
const screenGesture = useScreenGesture();

const myPanGesture = Gesture.Pan()
  .waitFor(screenGesture) // Wait for navigation gesture to fail first
  .onUpdate(...);
```
