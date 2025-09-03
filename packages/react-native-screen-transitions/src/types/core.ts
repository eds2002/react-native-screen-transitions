import type { AnimatedProps } from "react-native-reanimated";
import type { TransitionSpec } from "./animation";

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

	/**
	 * Eagerly measure this component on layout and store the result in the
	 * Bounds registry. Useful for nested shared elements that may not receive
	 * the press event but still need up-to-date measurements at navigation time.
	 *
	 * Only has an effect when used together with `sharedBoundTag`.
	 */
	measureOnLayout?: boolean;
};

export type TransitionConfig = {
	open: TransitionSpec;
	close: TransitionSpec;
};
