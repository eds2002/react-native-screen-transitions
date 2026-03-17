[**Documentation**](../../README.md)

***

[Documentation](../../README.md) / [shared](../README.md) / ScreenTransitionConfig

# Type Alias: ScreenTransitionConfig

> **ScreenTransitionConfig** = `object`

Defined in: shared/types/screen.types.ts:68

## Properties

### backdropBehavior?

> `optional` **backdropBehavior**: `"block"` \| `"passthrough"` \| `"dismiss"` \| `"collapse"`

Defined in: shared/types/screen.types.ts:215

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

> `optional` **backdropComponent**: `React.FC`

Defined in: shared/types/screen.types.ts:228

Custom component to render as the backdrop layer.
When provided, replaces the default backdrop entirely — including press handling.

Use `useScreenAnimation()` inside the component to access animation values.
Use your navigation method of choice (e.g. `router.back()`) to handle dismissal.

`backdropBehavior` still controls container-level pointer events when this is set.

#### Default

```ts
undefined
```

***

### expandViaScrollView?

> `optional` **expandViaScrollView**: `boolean`

Defined in: shared/types/screen.types.ts:192

Controls whether swiping to expand the sheet works from within a ScrollView.

- `true` (Apple Maps style): Swiping up at scroll top expands the sheet
- `false` (Instagram style): Expand only works via deadspace (non-scrollable areas)

Collapse (swipe down at scroll top) always works regardless of this setting.

Only applies to screens with `snapPoints` configured.

#### Default

```ts
true
```

***

### experimental\_enableHighRefreshRate?

> `optional` **experimental\_enableHighRefreshRate**: `boolean`

Defined in: shared/types/screen.types.ts:160

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

Defined in: shared/types/screen.types.ts:118

The area of the screen where the gesture is activated.

***

### gestureDirection?

> `optional` **gestureDirection**: `GestureDirection` \| `GestureDirection`[]

Defined in: shared/types/screen.types.ts:90

The direction of the swipe gesture used to dismiss the screen.

***

### gestureDrivesProgress?

> `optional` **gestureDrivesProgress**: `boolean`

Defined in: shared/types/screen.types.ts:113

Whether the gesture drives the progress.

***

### gestureEnabled?

> `optional` **gestureEnabled**: `boolean`

Defined in: shared/types/screen.types.ts:85

Controls whether swipe-to-dismiss is enabled.

For screens with `snapPoints`, gesture-driven snapping between non-dismiss
snap points remains available even when this is `false`.

***

### gestureResponseDistance?

> `optional` **gestureResponseDistance**: `number`

Defined in: shared/types/screen.types.ts:108

Distance threshold for gesture recognition throughout the screen.

***

### gestureSnapLocked?

> `optional` **gestureSnapLocked**: `boolean`

Defined in: shared/types/screen.types.ts:203

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

Defined in: shared/types/screen.types.ts:96

How much the gesture's final velocity impacts the dismiss decision.

#### Default

```ts
0.3
```

***

### initialSnapIndex?

> `optional` **initialSnapIndex**: `number`

Defined in: shared/types/screen.types.ts:178

The initial snap point index when the screen opens.

#### Default

```ts
0
```

***

### meta?

> `optional` **meta**: `Record`\<`string`, `unknown`\>

Defined in: shared/types/screen.types.ts:126

Custom metadata passed through to animation props.

#### Example

```ts
options={{ meta: { scalesOthers: true } }}
```

***

### overlay()?

> `optional` **overlay**: (`props`) => `React.ReactNode`

Defined in: shared/types/screen.types.ts:132

Function that returns a React Element to display as an overlay.
For container overlays (overlayMode: 'container'), use ContainerOverlayProps which includes children.

#### Parameters

##### props

[`OverlayProps`](OverlayProps.md)

#### Returns

`React.ReactNode`

***

### ~~overlayMode?~~

> `optional` **overlayMode**: [`OverlayMode`](OverlayMode.md)

Defined in: shared/types/screen.types.ts:142

How the overlay is positioned relative to screens.

#### Deprecated

This option is no longer needed. Overlays now always render as "float" mode
(single persistent overlay above all screens). For per-screen overlays, render an
absolute-positioned view directly in your screen component and use `useScreenAnimation()`
to access animation values.

***

### overlayShown?

> `optional` **overlayShown**: `boolean`

Defined in: shared/types/screen.types.ts:148

Whether to show the overlay. The overlay is shown by default when `overlay` is provided.
Setting this to `false` hides the overlay.

***

### screenStyleInterpolator?

> `optional` **screenStyleInterpolator**: [`ScreenStyleInterpolator`](ScreenStyleInterpolator.md)

Defined in: shared/types/screen.types.ts:72

The user-provided function to calculate styles based on animation progress.

***

### snapPoints?

> `optional` **snapPoints**: `number`[]

Defined in: shared/types/screen.types.ts:171

Describes heights where a screen can rest, as fractions of screen height.
Pass an array of ascending values from 0 to 1.

#### Example

```ts
snapPoints={[0.5, 1.0]} // 50% and 100% of screen height
```

#### Default

```ts
[1.0]
```

***

### snapVelocityImpact?

> `optional` **snapVelocityImpact**: `number`

Defined in: shared/types/screen.types.ts:103

How much velocity affects snap point targeting. Lower values make snapping
feel more deliberate (iOS-like), higher values make it more responsive to flicks.

#### Default

```ts
0.1
```

***

### transitionSpec?

> `optional` **transitionSpec**: [`TransitionSpec`](../interfaces/TransitionSpec.md)

Defined in: shared/types/screen.types.ts:77

The Reanimated animation config for opening and closing transitions.
