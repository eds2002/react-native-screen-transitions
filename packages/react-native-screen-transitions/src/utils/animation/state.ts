import type { SharedValue } from "react-native-reanimated";

export type AnimationState = "settled" | "finished" | "cancelled";

export type AnimationStateCallback = (state: AnimationState) => void;

export type AnimationProgressDriver = {
	value: SharedValue<number>;
	from: number;
	to: number;
};
