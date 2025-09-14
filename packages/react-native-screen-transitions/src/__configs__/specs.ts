import type { WithSpringConfig } from "react-native-reanimated";

export const DefaultSpec: WithSpringConfig = {
	stiffness: 1000,
	damping: 500,
	mass: 3,
	overshootClamping: true,
	// @ts-expect-error
	restSpeedThreshold: 0.02,
};
