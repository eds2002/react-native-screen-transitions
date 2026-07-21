import type { SharedValue } from "react-native-reanimated";

export const syncStackProgressValues = (
	visualProgressValues: SharedValue<number>[],
	stackProgressValues: SharedValue<number>[],
) => {
	"worklet";
	let total = 0;

	for (let i = visualProgressValues.length - 1; i >= 0; i--) {
		total += visualProgressValues[i]?.get() ?? 0;
		const stackProgress = stackProgressValues[i];

		if (stackProgress && stackProgress.get() !== total) {
			stackProgress.set(total);
		}
	}
};

export const resolveStackProgress = (
	stackProgress: SharedValue<number> | undefined,
	fallbackProgress: number,
	currentProgress: number,
	previousCurrentProgress: number | undefined,
	nextProgress: number | undefined,
	previousNextProgress: number | undefined,
) => {
	"worklet";
	if (!stackProgress) {
		return fallbackProgress;
	}

	let total = stackProgress.get();

	if (previousCurrentProgress !== undefined) {
		total += currentProgress - previousCurrentProgress;
	}

	if (nextProgress !== undefined && previousNextProgress !== undefined) {
		total += nextProgress - previousNextProgress;
	}

	return total;
};
