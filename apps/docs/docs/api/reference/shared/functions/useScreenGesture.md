[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / useScreenGesture

# Function: useScreenGesture()

> **useScreenGesture**(`target?`): `ScreenGestureRef`

Defined in: [shared/hooks/gestures/use-screen-gesture.ts:20](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/hooks/gestures/use-screen-gesture.ts#L20)

Returns a ref to a screen navigation pan gesture.
Use this to coordinate child gestures with the navigation gesture.

## Parameters

### target?

[`ScreenGestureTarget`](../type-aliases/ScreenGestureTarget.md)

## Returns

`ScreenGestureRef`

## Example

```tsx
const screenGesture = useScreenGesture();

const myPanGesture = Gesture.Pan()
  .waitFor(screenGesture) // Wait for navigation gesture to fail first
  .onUpdate(...);
```
