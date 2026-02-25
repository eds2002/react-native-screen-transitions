import { useAnimatedReaction } from "react-native-reanimated";
import { useScrollSettleContext } from "../../../providers/scroll-settle.provider";
import type { AnimationStore } from "../../../stores/animation.store";
import type { MaybeMeasureAndStoreParams } from "../types";

export const useScrollSettledMeasurement = (params: {
	enabled: boolean;
	group: string | undefined;
	hasNextScreen: boolean;
	isAnimating: ReturnType<typeof AnimationStore.getAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { enabled, group, hasNextScreen, isAnimating, maybeMeasureAndStore } =
		params;
	const scrollSettle = useScrollSettleContext();
	const settledSignal = scrollSettle?.settledSignal;

	useAnimatedReaction(
		() => settledSignal?.value ?? 0,
		(signal, previousSignal) => {
			"worklet";
			if (!enabled) return;
			if (!group || !hasNextScreen || !settledSignal) return;
			if (signal === 0 || signal === previousSignal) return;
			if (isAnimating.value) return;

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
			maybeMeasureAndStore,
		],
	);
};
