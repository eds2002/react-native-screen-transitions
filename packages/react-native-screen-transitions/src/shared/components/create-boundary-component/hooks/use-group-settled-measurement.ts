import {
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { useScrollSettleContext } from "../../../providers/scroll-settle.provider";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";

export const useGroupSettledMeasurement = (params: {
	enabled: boolean;
	group: string | undefined;
	id: BoundaryId;
	shouldUpdateDestination: boolean;
	isAnimating: SharedValue<number>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		group,
		id,
		shouldUpdateDestination,
		isAnimating,
		maybeMeasureAndStore,
	} = params;
	const scrollSettle = useScrollSettleContext();
	const settledSignal = scrollSettle?.settledSignal;
	const allGroups = BoundStore.getGroups();
	const idStr = String(id);
	const hasPendingDestinationRefresh = useSharedValue(false);

	useAnimatedReaction(
		() => settledSignal?.value ?? 0,
		(signal, previousSignal) => {
			"worklet";
			if (!enabled) return;
			if (!group || !shouldUpdateDestination || !settledSignal) return;
			if (signal === 0 || signal === previousSignal) return;

			const activeId = BoundStore.getGroupActiveId(group);
			if (!activeId) return;

			if (BoundStore.getGroupSettledActiveId(group) !== activeId) {
				BoundStore.setGroupSettledActiveId(group, activeId);
			}

			if (activeId !== idStr) {
				hasPendingDestinationRefresh.value = false;
				return;
			}

			if (isAnimating.value) {
				hasPendingDestinationRefresh.value = true;
				return;
			}

			hasPendingDestinationRefresh.value = false;
			maybeMeasureAndStore({ shouldUpdateDestination: true });
		},
		[
			enabled,
			group,
			idStr,
			shouldUpdateDestination,
			settledSignal,
			isAnimating,
			hasPendingDestinationRefresh,
			maybeMeasureAndStore,
		],
	);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return false;
			if (!group || !shouldUpdateDestination || !settledSignal) return false;
			if (!hasPendingDestinationRefresh.value) return false;
			if (isAnimating.value) return false;
			return allGroups.value[group]?.settledActiveId === idStr;
		},
		(shouldFlush, previousShouldFlush) => {
			"worklet";
			if (!enabled) return;
			if (!group || !shouldUpdateDestination || !settledSignal) return;
			if (!shouldFlush || shouldFlush === previousShouldFlush) return;

			hasPendingDestinationRefresh.value = false;
			maybeMeasureAndStore({ shouldUpdateDestination: true });
		},
		[
			enabled,
			group,
			idStr,
			shouldUpdateDestination,
			settledSignal,
			isAnimating,
			allGroups,
			hasPendingDestinationRefresh,
			maybeMeasureAndStore,
		],
	);
};
