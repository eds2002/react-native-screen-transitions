import type { SharedValue } from "react-native-reanimated";

export type AnimationState = {
	finished: boolean;
	settled: boolean;
};

export type AnimationStateCallback = (state: AnimationState) => void;

export type AnimationProgressDriver = {
	value: SharedValue<number>;
	from: number;
	to: number;
};
