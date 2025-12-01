import type { AnimatedProps } from "react-native-reanimated";
import type { ScreenStyleInterpolator, TransitionSpec } from "./animation.types";
import type { GestureActivationArea, GestureDirection } from "./gesture.types";

export type Layout = {
	width: number;
	height: number;
};

export type ScreenKey = string;

export type ScreenPhase = "previous" | "current" | "next";

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

export type TransitionConfig = {
	open: TransitionSpec;
	close: TransitionSpec;
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
	 * Whether to enable transitions. It sets the presentation to containedTransparentModal, animation none, and headerShown to false.
	 */
	enableTransitions?: boolean;
};
