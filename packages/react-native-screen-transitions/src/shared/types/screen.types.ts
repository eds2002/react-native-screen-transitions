import type { AnimatedProps } from "react-native-reanimated";
import type {
	ScreenStyleInterpolator,
	TransitionSpec,
} from "./animation.types";
import type { GestureActivationArea, GestureDirection } from "./gesture.types";
import type { OverlayProps } from "./overlay.types";

export type Layout = {
	width: number;
	height: number;
};

export type ScreenKey = string;
export type SheetScrollGestureBehavior =
	| "expand-and-collapse"
	| "collapse-only";

/**
 * A single snap point value. Either a fraction of screen height (0–1) or
 * `'auto'` to snap to the intrinsic height of the screen content.
 */
export type SnapPoint = number | "auto";

export type BackdropBehavior = "block" | "passthrough" | "dismiss" | "collapse";

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
	 * screenStyleInterpolator: ({ progress }) => {
	 *   "worklet";
	 *   return {
	 *     'hero-image': {
	 *       opacity: interpolate(progress, [0, 1], [0, 1]),
	 *       transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }]
	 *     }
	 *   }
	 * }
	 */
	styleId?: string;
};

export type ScreenTransitionConfig = {
	/**
	 * The user-provided function to calculate styles based on animation progress.
	 *
	 * Return `null`, `undefined`, or `{}` to apply no transition styles for the
	 * current frame.
	 */
	screenStyleInterpolator?: ScreenStyleInterpolator;

	/**
	 * The Reanimated animation config for opening and closing transitions.
	 */
	transitionSpec?: TransitionSpec;

	/**
	 * Pre-mounts the masked view wrapper so navigation bounds masking
	 * (e.g. `bounds().navigation.zoom()`) is ready from the first frame.
	 *
	 * Requires `@react-native-masked-view/masked-view` to be installed.
	 *
	 * @default false
	 */
	navigationMaskEnabled?: boolean;

	/**
	 * Controls whether swipe-to-dismiss is enabled.
	 *
	 * For screens with `snapPoints`, gesture-driven snapping between non-dismiss
	 * snap points remains available even when this is `false`.
	 */
	gestureEnabled?: boolean;

	/**
	 * The direction(s) of the screen gesture used to dismiss the screen.
	 *
	 * Supports pan directions (`horizontal`, `vertical`, etc.) and pinch
	 * directions (`pinch-in`, `pinch-out`).
	 */
	gestureDirection?: GestureDirection | GestureDirection[];

	/**
	 * Controls how directly live gesture movement maps into transition progress.
	 * Lower values feel less sensitive, higher values feel more responsive.
	 * @default 1
	 */
	gestureSensitivity?: number;

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
	gestureSnapVelocityImpact?: number;

	/**
	 * Multiplies gesture release velocity used for spring animation energy.
	 *
	 * This does NOT affect dismissal threshold decisions (`gestureVelocityImpact`)
	 * or snap target selection (`gestureSnapVelocityImpact`). It only changes how fast
	 * the post-release animation feels.
	 *
	 * @default 1
	 */
	gestureReleaseVelocityScale?: number;

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
	 */
	overlay?: (props: OverlayProps) => React.ReactNode;

	/**
	 * Whether to show the overlay. The overlay is shown by default when `overlay` is provided.
	 * Setting this to `false` hides the overlay.
	 */
	overlayShown?: boolean;

	/**
	 * Animates the first screen in a navigator from its closed state on initial mount
	 * instead of snapping directly to its settled progress.
	 *
	 * Useful for launch/onboarding flows where the initial screen should participate
	 * in the same transition system as pushed screens.
	 *
	 * @experimental This API may change in future versions.
	 * @default false
	 */
	experimental_animateOnInitialMount?: boolean;

	/**
	 * Describes heights where a screen can rest, as fractions of screen height,
	 * or `'auto'` to snap to the intrinsic height of the screen content.
	 *
	 * Pass an array of ascending values from 0 to 1, or `'auto'`.
	 * The `'auto'` value measures the content's natural height after layout and
	 * converts it to the equivalent fraction of the screen height.
	 *
	 * @example
	 * snapPoints={[0.5, 1.0]}     // 50% and 100% of screen height
	 * snapPoints={['auto']}       // snap to content height
	 * snapPoints={['auto', 1.0]}  // content height or full screen
	 *
	 * @default [1.0]
	 */
	snapPoints?: SnapPoint[];

	/**
	 * The initial snap point index when the screen opens.
	 *
	 * @default 0
	 */
	initialSnapIndex?: number;

	/**
	 * Controls how nested scroll content hands gestures off to a snap sheet.
	 *
	 * - `"expand-and-collapse"` (Apple Maps style): Swiping up at scroll boundary expands the sheet,
	 *   and swiping down at scroll boundary collapses or dismisses it
	 * - `"collapse-only"` (Instagram style): Expand only works via deadspace; collapse/dismiss via
	 *   nested scroll content still works at boundary
	 *
	 * Only applies to screens with `snapPoints` configured.
	 *
	 * @default "expand-and-collapse"
	 */
	sheetScrollGestureBehavior?: SheetScrollGestureBehavior;

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
	backdropBehavior?: BackdropBehavior;

	/**
	 * Custom component to render as the backdrop layer (between screens).
	 *
	 * The library wraps this component with `Animated.createAnimatedComponent` internally.
	 * Animated styles and props are driven by the `backdrop` slot in the interpolator return value.
	 *
	 * `backdropBehavior` still controls the wrapping Pressable for dismiss/collapse handling.
	 *
	 * @example
	 * backdropComponent: BlurView,
	 * screenStyleInterpolator: ({ progress }) => {
	 *   "worklet";
	 *   return {
	 *     backdrop: {
	 *       style: { opacity: interpolate(progress, [0, 1], [0, 1]) },
	 *       props: { intensity: interpolate(progress, [0, 1], [0, 80]) },
	 *     },
	 *   };
	 * }
	 *
	 * @default undefined
	 */
	backdropComponent?: React.ComponentType<any>;

	/**
	 * Custom component to render as the screen's surface layer.
	 *
	 * Renders inside the content animation scope (moves with the screen) as an
	 * absolutely-positioned layer behind the screen's children.
	 *
	 * The library wraps this component with `Animated.createAnimatedComponent` internally.
	 * Animated styles and props are driven by the `surface` slot in the interpolator return value.
	 *
	 * @example
	 * surfaceComponent: SquircleView,
	 * screenStyleInterpolator: ({ progress }) => {
	 *   "worklet";
	 *   return {
	 *     surface: {
	 *       style: { opacity: interpolate(progress, [0, 1], [0, 1]) },
	 *       props: { cornerRadius: 24, cornerSmoothing: 0.7 },
	 *     },
	 *   };
	 * }
	 *
	 * @default undefined
	 */
	surfaceComponent?: React.ComponentType<any>;
};
