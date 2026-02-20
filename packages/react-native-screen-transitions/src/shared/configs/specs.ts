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

export const IOSSpec: WithSpringConfig = {
	mass: 1,
	stiffness: 520,
	damping: 62,
	overshootClamping: true,
	// @ts-expect-error
	restSpeedThreshold: 0.01,
	restDisplacementThreshold: 0.01,
};
export const IOSZoomSpec: WithSpringConfig = {
	mass: 1,
	stiffness: 380,
	damping: 40,
	overshootClamping: true,
	// @ts-expect-error
	restSpeedThreshold: 0.01,
	restDisplacementThreshold: 0.01,
};

export const FlingSpec: WithSpringConfig = {
	damping: 20,
	stiffness: 200,
	mass: 1,
	overshootClamping: false,
};
