import type { SharedValue } from "react-native-reanimated";

export type StackProgressEntry = {
	routeKey: string;
	visualProgress: SharedValue<number>;
};

export const readStackProgress = (
	entries: readonly StackProgressEntry[],
	routeKey: string,
	fallbackProgress: number,
) => {
	"worklet";
	let progress = 0;

	for (let index = entries.length - 1; index >= 0; index--) {
		const entry = entries[index];
		if (!entry) continue;

		progress += entry.visualProgress.get();
		if (entry.routeKey === routeKey) return progress;
	}

	return fallbackProgress;
};
