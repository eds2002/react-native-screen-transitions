import type { TransitionSpec } from "react-native-screen-transitions";

/**
 * Spring configuration for smooth animations
 */
export const transitionSpec: TransitionSpec = {
	open: {
		stiffness: 300,
		damping: 30,
		mass: 1,
	},
	close: {
		stiffness: 300,
		damping: 30,
		mass: 1,
	},
};
