import type { Route } from "@react-navigation/native";
import type { AnimatedProps, DerivedValue } from "react-native-reanimated";
import type {
	OverlayInterpolationProps,
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	TransitionSpec,
} from "./animation.types";
import type { GestureActivationArea, GestureDirection } from "./gesture.types";

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
};

/**
 * Props passed to overlay components.
 * Generic over the navigation type since different stacks have different navigation props.
 */
export type OverlayProps<TNavigation = unknown> = {
	/**
	 * Route of the currently focused screen in the stack.
	 */
	focusedRoute: Route<string>;

	/**
	 * Index of the focused route in the stack.
	 */
	focusedIndex: number;

	/**
	 * All routes currently in the stack.
	 */
	routes: Route<string>[];

	/**
	 * Custom metadata from the focused screen's options.
	 */
	meta?: Record<string, unknown>;

	/**
	 * Navigation prop for the overlay.
	 */
	navigation: TNavigation;

	/**
	 * Animation values for the overlay.
	 */
	overlayAnimation: DerivedValue<OverlayInterpolationProps>;

	/**
	 * Animation values for the screen.
	 */
	screenAnimation: DerivedValue<ScreenInterpolationProps>;
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
	 */
	gestureVelocityImpact?: number;

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
	 * Function that given `OverlayProps` returns a React Element to display as an overlay.
	 * The navigation type is `unknown` here to avoid circular references in type definitions.
	 * Each stack defines its own typed overlay props (e.g., BlankStackOverlayProps).
	 */
	overlay?: (props: OverlayProps) => React.ReactNode;

	/**
	 * How the overlay is positioned relative to screens.
	 * - 'float': Single persistent overlay above all screens (like iOS tab bar)
	 * - 'screen': Per-screen overlay that transitions with content
	 * @default 'screen'
	 */
	overlayMode?: "float" | "screen";

	/**
	 * Whether to show the overlay. The overlay is shown by default when `overlay` is provided.
	 * Setting this to `false` hides the overlay.
	 */
	overlayShown?: boolean;
};
