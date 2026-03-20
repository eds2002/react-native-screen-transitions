import {
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";

export const useGroupActiveSourceMeasurement = (params: {
	enabled: boolean;
	group: string | undefined;
	id: BoundaryId;
	hasNextScreen: boolean;
	isAnimating: SharedValue<number>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		group,
		id,
		hasNextScreen,
		isAnimating,
		maybeMeasureAndStore,
	} = params;
	const idStr = String(id);
	const allGroups = BoundStore.getGroups();
	const hasPendingSourceRefresh = useSharedValue(false);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return null;
			if (!group) return null;
			return allGroups.value[group]?.activeId ?? null;
		},
		(activeId, previousActiveId) => {
			"worklet";
			if (!enabled) return;
			if (!group || !hasNextScreen) return;

			if (activeId !== idStr) {
				hasPendingSourceRefresh.value = false;
				return;
			}

			if (activeId === idStr && activeId !== previousActiveId) {
				if (isAnimating.value) {
					hasPendingSourceRefresh.value = true;
					return;
				}

				hasPendingSourceRefresh.value = false;
				maybeMeasureAndStore({
					shouldRegisterSnapshot: true,
					shouldUpdateSource: true,
				});
			}
		},
		[
			enabled,
			group,
			idStr,
			hasNextScreen,
			isAnimating,
			allGroups,
			hasPendingSourceRefresh,
			maybeMeasureAndStore,
		],
	);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return false;
			if (!group || !hasNextScreen) return false;
			if (!hasPendingSourceRefresh.value) return false;
			if (isAnimating.value) return false;
			return allGroups.value[group]?.activeId === idStr;
		},
		(shouldFlush, previousShouldFlush) => {
			"worklet";
			if (!enabled) return;
			if (!group || !hasNextScreen) return;
			if (!shouldFlush || shouldFlush === previousShouldFlush) return;

			hasPendingSourceRefresh.value = false;
			maybeMeasureAndStore({
				shouldRegisterSnapshot: true,
				shouldUpdateSource: true,
			});
		},
		[
			enabled,
			group,
			idStr,
			hasNextScreen,
			isAnimating,
			allGroups,
			hasPendingSourceRefresh,
			maybeMeasureAndStore,
		],
	);
};
