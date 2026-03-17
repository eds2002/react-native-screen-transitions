[**react-native-screen-transitions**](../../README.md)

***

[react-native-screen-transitions](../../README.md) / [shared](../README.md) / ScreenTransitionConfig

# Type Alias: ScreenTransitionConfig

> **ScreenTransitionConfig** = `object`

Defined in: [shared/types/screen.types.ts:77](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L77)

## Properties

### backdropBehavior?

> `optional` **backdropBehavior**: `"block"` \| `"passthrough"` \| `"dismiss"` \| `"collapse"`

Defined in: [shared/types/screen.types.ts:265](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L265)

Controls how touches interact with the backdrop area (outside the screen content).

- `'block'`: Backdrop catches all touches (default for most screens)
- `'passthrough'`: Touches pass through to content behind (default for component stacks)
- `'dismiss'`: Tapping backdrop dismisses the screen
- `'collapse'`: Tapping backdrop collapses to next lower snap point (dismisses at min)

#### Default

```ts
'block' (or 'passthrough' for component stacks)
```

***

### backdropComponent?

> `optional` **backdropComponent**: `React.ComponentType`\<`any`\>

Defined in: [shared/types/screen.types.ts:286](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L286)

Custom component to render as the backdrop layer (between screens).

The library wraps this component with `Animated.createAnimatedComponent` internally.
Animated styles and props are driven by the `backdrop` slot in the interpolator return value.

`backdropBehavior` still controls the wrapping Pressable for dismiss/collapse handling.

#### Example

```ts
backdropComponent: BlurView,
screenStyleInterpolator: ({ progress }) => ({
  backdrop: {
    style: { opacity: interpolate(progress, [0, 1], [0, 1]) },
    props: { intensity: interpolate(progress, [0, 1], [0, 80]) },
  },
})
```

#### Default

```ts
undefined
```

***

### ~~expandViaScrollView?~~

> `optional` **expandViaScrollView**: `boolean`

Defined in: [shared/types/screen.types.ts:242](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L242)

#### Deprecated

Use `sheetScrollGestureBehavior` instead.

Mapping:
- `true` -> `"expand-and-collapse"`
- `false` -> `"collapse-only"`

***

### experimental\_enableHighRefreshRate?

> `optional` **experimental\_enableHighRefreshRate**: `boolean`

Defined in: [shared/types/screen.types.ts:195](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L195)

**`Experimental`**

Forces the display to run at its maximum refresh rate during screen transitions.
Prevents iOS/Android from throttling to 60fps for battery savings.

Useful for smoother animations on high refresh rate displays (90/120/144Hz).
Note: Increases battery usage while active.

 This API may change in future versions.

#### Default

```ts
false
```

***

### gestureActivationArea?

> `optional` **gestureActivationArea**: `GestureActivationArea`

Defined in: [shared/types/screen.types.ts:164](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L164)

The area of the screen where the gesture is activated.

***

### gestureDirection?

> `optional` **gestureDirection**: `GestureDirection` \| `GestureDirection`[]

Defined in: [shared/types/screen.types.ts:114](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L114)

The direction of the swipe gesture used to dismiss the screen.

***

### gestureDrivesProgress?

> `optional` **gestureDrivesProgress**: `boolean`

Defined in: [shared/types/screen.types.ts:159](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L159)

Whether the gesture drives the progress.

***

### gestureEnabled?

> `optional` **gestureEnabled**: `boolean`

Defined in: [shared/types/screen.types.ts:109](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L109)

Controls whether swipe-to-dismiss is enabled.

For screens with `snapPoints`, gesture-driven snapping between non-dismiss
snap points remains available even when this is `false`.

***

### gestureReleaseVelocityMax?

> `optional` **gestureReleaseVelocityMax**: `number`

Defined in: [shared/types/screen.types.ts:149](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L149)

Caps the absolute post-scale release velocity used by spring animations.

This does NOT affect dismissal threshold decisions (`gestureVelocityImpact`)
or snap target selection (`snapVelocityImpact`). It only bounds release
animation intensity after `gestureReleaseVelocityScale` is applied.

#### Default

```ts
3.2
```

***

### gestureReleaseVelocityScale?

> `optional` **gestureReleaseVelocityScale**: `number`

Defined in: [shared/types/screen.types.ts:138](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L138)

Multiplies gesture release velocity used for spring animation energy.

This does NOT affect dismissal threshold decisions (`gestureVelocityImpact`)
or snap target selection (`snapVelocityImpact`). It only changes how fast
the post-release animation feels.

#### Default

```ts
1
```

***

### gestureResponseDistance?

> `optional` **gestureResponseDistance**: `number`

Defined in: [shared/types/screen.types.ts:154](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L154)

Distance threshold for gesture recognition throughout the screen.

***

### gestureSnapLocked?

> `optional` **gestureSnapLocked**: `boolean`

Defined in: [shared/types/screen.types.ts:253](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L253)

Locks gesture-based snap movement to the current snap point.

When enabled, users cannot gesture between snap points. If dismiss gestures
are allowed (`gestureEnabled !== false`), swipe-to-dismiss still works.
Programmatic `snapTo()` calls are not affected.

#### Default

```ts
false
```

***

### gestureVelocityImpact?

> `optional` **gestureVelocityImpact**: `number`

Defined in: [shared/types/screen.types.ts:120](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L120)

How much the gesture's final velocity impacts the dismiss decision.

#### Default

```ts
0.3
```

***

### initialSnapIndex?

> `optional` **initialSnapIndex**: `number`

Defined in: [shared/types/screen.types.ts:219](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L219)

The initial snap point index when the screen opens.

#### Default

```ts
0
```

***

### ~~maskEnabled?~~

> `optional` **maskEnabled**: `boolean`

Defined in: [shared/types/screen.types.ts:101](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L101)

#### Deprecated

Use `navigationMaskEnabled` instead.

***

### meta?

> `optional` **meta**: `Record`\<`string`, `unknown`\>

Defined in: [shared/types/screen.types.ts:172](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L172)

Custom metadata passed through to animation props.

#### Example

```ts
options={{ meta: { scalesOthers: true } }}
```

***

### navigationMaskEnabled?

> `optional` **navigationMaskEnabled**: `boolean`

Defined in: [shared/types/screen.types.ts:96](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L96)

Pre-mounts the masked view wrapper so navigation bounds masking
(e.g. `bounds().navigation.zoom()`) is ready from the first frame.

Requires `@react-native-masked-view/masked-view` to be installed.

#### Default

```ts
false
```

***

### overlay()?

> `optional` **overlay**: (`props`) => `React.ReactNode`

Defined in: [shared/types/screen.types.ts:177](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L177)

Function that returns a React Element to display as an overlay.

#### Parameters

##### props

[`OverlayProps`](OverlayProps.md)

#### Returns

`React.ReactNode`

***

### overlayShown?

> `optional` **overlayShown**: `boolean`

Defined in: [shared/types/screen.types.ts:183](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L183)

Whether to show the overlay. The overlay is shown by default when `overlay` is provided.
Setting this to `false` hides the overlay.

***

### screenStyleInterpolator?

> `optional` **screenStyleInterpolator**: [`ScreenStyleInterpolator`](ScreenStyleInterpolator.md)

Defined in: [shared/types/screen.types.ts:81](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L81)

The user-provided function to calculate styles based on animation progress.

***

### sheetScrollGestureBehavior?

> `optional` **sheetScrollGestureBehavior**: `SheetScrollGestureBehavior`

Defined in: [shared/types/screen.types.ts:233](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L233)

Controls how nested scroll content hands gestures off to a snap sheet.

- `"expand-and-collapse"` (Apple Maps style): Swiping up at scroll boundary expands the sheet,
  and swiping down at scroll boundary collapses or dismisses it
- `"collapse-only"` (Instagram style): Expand only works via deadspace; collapse/dismiss via
  nested scroll content still works at boundary

Only applies to screens with `snapPoints` configured.

#### Default

```ts
"expand-and-collapse"
```

***

### snapPoints?

> `optional` **snapPoints**: `SnapPoint`[]

Defined in: [shared/types/screen.types.ts:212](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L212)

Describes heights where a screen can rest, as fractions of screen height,
or `'auto'` to snap to the intrinsic height of the screen content.

Pass an array of ascending values from 0 to 1, or `'auto'`.
The `'auto'` value measures the content's natural height after layout and
converts it to the equivalent fraction of the screen height.

#### Example

```ts
snapPoints={[0.5, 1.0]}     // 50% and 100% of screen height
snapPoints={['auto']}       // snap to content height
snapPoints={['auto', 1.0]}  // content height or full screen
```

#### Default

```ts
[1.0]
```

***

### snapVelocityImpact?

> `optional` **snapVelocityImpact**: `number`

Defined in: [shared/types/screen.types.ts:127](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L127)

How much velocity affects snap point targeting. Lower values make snapping
feel more deliberate (iOS-like), higher values make it more responsive to flicks.

#### Default

```ts
0.1
```

***

### surfaceComponent?

> `optional` **surfaceComponent**: `React.ComponentType`\<`any`\>

Defined in: [shared/types/screen.types.ts:308](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L308)

Custom component to render as the screen's surface layer.

Renders inside the content animation scope (moves with the screen) as an
absolutely-positioned layer behind the screen's children.

The library wraps this component with `Animated.createAnimatedComponent` internally.
Animated styles and props are driven by the `surface` slot in the interpolator return value.

#### Example

```ts
surfaceComponent: SquircleView,
screenStyleInterpolator: ({ progress }) => ({
  surface: {
    style: { opacity: interpolate(progress, [0, 1], [0, 1]) },
    props: { cornerRadius: 24, cornerSmoothing: 0.7 },
  },
})
```

#### Default

```ts
undefined
```

***

### transitionSpec?

> `optional` **transitionSpec**: [`TransitionSpec`](../interfaces/TransitionSpec.md)

Defined in: [shared/types/screen.types.ts:86](https://github.com/eds2002/react-native-screen-transitions/blob/7c21934e69c463261a586dc76c94041c42963d31/packages/react-native-screen-transitions/src/shared/types/screen.types.ts#L86)

The Reanimated animation config for opening and closing transitions.
