import type { AnimatedProps } from "react-native-reanimated";

export type TransitionAwareProps<T extends object> = AnimatedProps<T> & {
	/**
	 * You can pass styles to this component if you return this id in the screenStyleInterpolator.
	 * const id = 'masked-view'
	 * return {
	 *   [id]: {...},
	 * }
	 */
	styleId?: string;
	/**
	 * Use this to store the measurements of the component when it is pressed.
	 */
	sharedBoundTag?: string;
};
