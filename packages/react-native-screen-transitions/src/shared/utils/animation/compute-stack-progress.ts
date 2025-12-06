import type { AnimationStoreMap } from "../../stores/animation.store";

export const computeStackProgress = (
	stackAnimationValues: AnimationStoreMap[],
	fallback: number = 0,
) => {
	"worklet";
	let computedStackProgress: number | undefined;
	if (stackAnimationValues.length > 0) {
		computedStackProgress = 0;
		for (let i = 0; i < stackAnimationValues.length; i += 1) {
			computedStackProgress += stackAnimationValues[i].progress.value;
		}
	}
	return computedStackProgress ?? fallback;
};
