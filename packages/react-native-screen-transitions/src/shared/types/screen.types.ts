import type { AnimatedProps } from "react-native-reanimated";
import type {
	ScreenStyleInterpolator,
	TransitionSpec,
} from "./animation.types";
import type { GestureActivationArea, GestureDirection } from "./gesture.types";
import type { OverlayMode, OverlayProps } from "./overlay.types";

export type Layout = {
	width: number;
	height: number;
};

export type ScreenKey = string;

export type TransitionAwareProps<T extends object> = AnimatedProps<T> & {
	/**
	 * Connects this component to custom animated styles defined in screenStyleInterpolator.
	 *
	 * When you return custom styles from your interpolator with a matching key,
	 * those styles will be applied to this component during transitions.
	 *
	 * @example
	 * // In your component:
	 * <Transition.View styleId="hero-image">
	 *   <Image source={...} />
	 * </Transition.View>
	 *
	 * // In your screenStyleInterpolator:
	 * return {
	 *   'hero-image': {
	 *     opacity: interpolate(progress, [0, 1], [0, 1]),
	 *     transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }]
	 *   }
	 * }
	 */
	styleId?: string;

	/**
	 * Marks this component for measurement to enable shared element transitions.
	 * Components with the same tag across different screens will animate between each other.
	 *
	 * @example
	 * // Screen A:
	 * <Transition.View sharedBoundTag="profile-avatar">
	 *   <Avatar size="small" />
	 * </Transition.View>
	 *
	 * // Screen B:
	 * <Transition.View sharedBoundTag="profile-avatar">
	 *   <Avatar size="large" />
	 * </Transition.View>
	 */
	sharedBoundTag?: string;

	/**
	 * Re-measures this component when the screen regains focus and updates
	 * any matching shared-bound source link in place.
	 *
	 * Useful when layout can change while unfocused (for example, programmatic
	 * ScrollView/FlatList scrolling triggered from another screen).
	 *
	 * @default false
	 */
	remeasureOnFocus?: boolean;
};

export type ScreenTransitionConfig = {
	/**
	 * The user-provided function to calculate styles based on animation progress.
	 */
	screenStyleInterpolator?: ScreenStyleInterpolator;

	/**
	 * The Reanimated animation config for opening and closing transitions.
	 */
	transitionSpec?: TransitionSpec;

	/**
	 * Whether the gesture is enabled.
	 */
	gestureEnabled?: boolean;

	/**
	 * The direction of the swipe gesture used to dismiss the screen.
	 */
	gestureDirection?: GestureDirection | GestureDirection[];

	/**
	 * How much the gesture's final velocity impacts the dismiss decision.
	 * @default 0.3
	 */
	gestureVelocityImpact?: number;

	/**
	 * How much velocity affects snap point targeting. Lower values make snapping
	 * feel more deliberate (iOS-like), higher values make it more responsive to flicks.
	 * @default 0.1
	 */
	snapVelocityImpact?: number;

	/**
	 * Distance threshold for gesture recognition throughout the screen.
	 */
	gestureResponseDistance?: number;

	/**
	 * Whether the gesture drives the progress.
	 */
	gestureDrivesProgress?: boolean;

	/**
	 * The area of the screen where the gesture is activated.
	 */
	gestureActivationArea?: GestureActivationArea;

	/**
	 * Custom metadata passed through to animation props.
	 *
	 * @example
	 * options={{ meta: { scalesOthers: true } }}
	 */
	meta?: Record<string, unknown>;

	/**
	 * Function that returns a React Element to display as an overlay.
	 * For container overlays (overlayMode: 'container'), use ContainerOverlayProps which includes children.
	 */
	overlay?: (props: OverlayProps) => React.ReactNode;

	/**
	 * How the overlay is positioned relative to screens.
	 *
	 * @deprecated This option is no longer needed. Overlays now always render as "float" mode
	 * (single persistent overlay above all screens). For per-screen overlays, render an
	 * absolute-positioned view directly in your screen component and use `useScreenAnimation()`
	 * to access animation values.
	 */
	overlayMode?: OverlayMode;

	/**
	 * Whether to show the overlay. The overlay is shown by default when `overlay` is provided.
	 * Setting this to `false` hides the overlay.
	 */
	overlayShown?: boolean;

	/**
	 * Forces the display to run at its maximum refresh rate during screen transitions.
	 * Prevents iOS/Android from throttling to 60fps for battery savings.
	 *
	 * Useful for smoother animations on high refresh rate displays (90/120/144Hz).
	 * Note: Increases battery usage while active.
	 *
	 * @experimental This API may change in future versions.
	 * @default false
	 */
	experimental_enableHighRefreshRate?: boolean;

	/**
	 * Describes heights where a screen can rest, as fractions of screen height.
	 * Pass an array of ascending values from 0 to 1.
	 *
	 * @example
	 * snapPoints={[0.5, 1.0]} // 50% and 100% of screen height
	 *
	 * @default [1.0]
	 */
	snapPoints?: number[];

	/**
	 * The initial snap point index when the screen opens.
	 *
	 * @default 0
	 */
	initialSnapIndex?: number;

	/**
	 * Controls whether swiping to expand the sheet works from within a ScrollView.
	 *
	 * - `true` (Apple Maps style): Swiping up at scroll top expands the sheet
	 * - `false` (Instagram style): Expand only works via deadspace (non-scrollable areas)
	 *
	 * Collapse (swipe down at scroll top) always works regardless of this setting.
	 *
	 * Only applies to screens with `snapPoints` configured.
	 *
	 * @default true
	 */
	expandViaScrollView?: boolean;

	/**
	 * Locks gesture-based snap movement to the current snap point.
	 *
	 * When enabled, users cannot gesture between snap points. If dismiss gestures
	 * are allowed (`gestureEnabled !== false`), swipe-to-dismiss still works.
	 * Programmatic `snapTo()` calls are not affected.
	 *
	 * @default false
	 */
	gestureSnapLocked?: boolean;

	/**
	 * Controls how touches interact with the backdrop area (outside the screen content).
	 *
	 * - `'block'`: Backdrop catches all touches (default for most screens)
	 * - `'passthrough'`: Touches pass through to content behind (default for component stacks)
	 * - `'dismiss'`: Tapping backdrop dismisses the screen
	 * - `'collapse'`: Tapping backdrop collapses to next lower snap point (dismisses at min)
	 *
	 * @default 'block' (or 'passthrough' for component stacks)
	 */
	backdropBehavior?: "block" | "passthrough" | "dismiss" | "collapse";
};
