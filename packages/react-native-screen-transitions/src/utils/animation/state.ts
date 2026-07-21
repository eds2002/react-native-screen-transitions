export type AnimationState = {
	finished: boolean;
	settled: boolean;
};

export type AnimationStateCallback = (state: AnimationState) => void;
