import type { WithSpringConfig } from "react-native-reanimated";

export const DefaultSpec: WithSpringConfig = {
	stiffness: 1000,
	damping: 500,
	mass: 3,
	overshootClamping: true,
	// @ts-expect-error
	restSpeedThreshold: 0.02,
};

export const DefaultSnapSpec: WithSpringConfig = {
	stiffness: 500,
	damping: 50,
	mass: 1,
};

export const FlingSpec: WithSpringConfig = {
	damping: 23.5,
	stiffness: 170,
	mass: 1,
	overshootClamping: false,
	energyThreshold: 6e-9,
};
