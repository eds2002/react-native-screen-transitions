import type { TransitionSpec } from "react-native-screen-transitions";

/**
 * Spring configuration for smooth animations
 */
export const transitionSpec: TransitionSpec = {
	open: {
		stiffness: 1000,
		damping: 500,
		mass: 3,
	},
	close: {
		stiffness: 1000,
		damping: 500,
		mass: 3,
	},
};
