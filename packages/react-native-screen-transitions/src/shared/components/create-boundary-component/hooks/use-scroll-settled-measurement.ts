import {
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { useScrollSettleContext } from "../../../providers/scroll-settle.provider";
import type { MaybeMeasureAndStoreParams } from "../types";

export const useScrollSettledMeasurement = (params: {
	enabled: boolean;
	group: string | undefined;
	hasNextScreen: boolean;
	isAnimating: SharedValue<number>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { enabled, group, hasNextScreen, isAnimating, maybeMeasureAndStore } =
		params;
	const scrollSettle = useScrollSettleContext();
	const settledSignal = scrollSettle?.settledSignal;
	const hasPendingSourceRefresh = useSharedValue(false);

	useAnimatedReaction(
		() => settledSignal?.value ?? 0,
		(signal, previousSignal) => {
			"worklet";
			if (!enabled) return;
			if (!group || !hasNextScreen || !settledSignal) return;
			if (signal === 0 || signal === previousSignal) return;
			if (isAnimating.value) {
				hasPendingSourceRefresh.value = true;
				return;
			}

			hasPendingSourceRefresh.value = false;
			// Re-measure source bounds after scroll settles while idle.
			// This captures post-scroll positions before close transition starts.
			maybeMeasureAndStore({ shouldUpdateSource: true });
		},
		[
			enabled,
			group,
			hasNextScreen,
			settledSignal,
			isAnimating,
			hasPendingSourceRefresh,
			maybeMeasureAndStore,
		],
	);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return false;
			if (!group || !hasNextScreen || !settledSignal) return false;
			return hasPendingSourceRefresh.value && !isAnimating.value;
		},
		(shouldFlush, previousShouldFlush) => {
			"worklet";
			if (!enabled) return;
			if (!group || !hasNextScreen || !settledSignal) return;
			if (!shouldFlush || shouldFlush === previousShouldFlush) return;

			hasPendingSourceRefresh.value = false;
			maybeMeasureAndStore({ shouldUpdateSource: true });
		},
		[
			enabled,
			group,
			hasNextScreen,
			settledSignal,
			isAnimating,
			hasPendingSourceRefresh,
			maybeMeasureAndStore,
		],
	);
};
