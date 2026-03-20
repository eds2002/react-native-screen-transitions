import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { useScrollSettleContext } from "../../../providers/scroll-settle.provider";
import type { MaybeMeasureAndStoreParams } from "../types";
import { shouldTriggerScrollSettledRefresh } from "./helpers/measurement-rules";
import { useDeferredMeasurementTrigger } from "./use-deferred-measurement-trigger";

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
	const { queueOrFlushMeasurement } = useDeferredMeasurementTrigger({
		enabled,
		isAnimating,
		onFlush: () => {
			"worklet";
			maybeMeasureAndStore({ intent: "refresh-source" });
		},
	});

	useAnimatedReaction(
		() => settledSignal?.value ?? 0,
		(signal, previousSignal) => {
			"worklet";
			if (
				!shouldTriggerScrollSettledRefresh({
					enabled,
					group,
					hasNextScreen,
					hasSettledSignal: !!settledSignal,
					signal,
					previousSignal,
				})
			) {
				return;
			}
			// Re-measure source bounds after scroll settles while idle.
			// This captures post-scroll positions before close transition starts.
			queueOrFlushMeasurement();
		},
		[enabled, group, hasNextScreen, settledSignal, queueOrFlushMeasurement],
	);
};
