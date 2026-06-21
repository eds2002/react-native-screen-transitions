import type { SharedValue } from "react-native-reanimated";

export const deriveStackProgress = (
	routeKeys: string[],
	visualProgressValues: SharedValue<number>[],
	currentIndex: number,
	fallbackProgress: number,
	currentRouteKey: string | undefined,
	currentProgress: number,
	nextRouteKey: string | undefined,
	nextProgress: number | undefined,
) => {
	"worklet";
	if (currentIndex < 0) return fallbackProgress;

	let total = 0;
	for (let i = currentIndex; i < visualProgressValues.length; i++) {
		const routeKey = routeKeys[i];
		if (routeKey === currentRouteKey) {
			total += currentProgress;
		} else if (routeKey === nextRouteKey && nextProgress !== undefined) {
			total += nextProgress;
		} else {
			total += visualProgressValues[i].get();
		}
	}

	return total;
};
