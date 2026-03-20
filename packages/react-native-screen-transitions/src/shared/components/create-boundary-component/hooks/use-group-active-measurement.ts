import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import { useDeferredMeasurementTrigger } from "./use-deferred-measurement-trigger";

/**
 * Watches the group's active id in the BoundStore.
 * When this boundary becomes the active member of its group,
 * re-measures itself and updates the link destination with fresh bounds.
 * This handles the case where a boundary scrolled into view after initial mount
 * (e.g., paging ScrollView in a detail screen).
 */
export const useGroupActiveMeasurement = (params: {
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
	const idStr = String(id);

	const allGroups = BoundStore.getGroups();
	const { clearPendingMeasurement, queueOrFlushMeasurement } =
		useDeferredMeasurementTrigger({
			enabled,
			isAnimating,
			canFlush: () => {
				"worklet";
				if (!group || !shouldUpdateDestination) return false;
				return allGroups.value[group]?.activeId === idStr;
			},
			onFlush: () => {
				"worklet";
				maybeMeasureAndStore({ intent: "refresh-destination" });
			},
		});

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
			if (!group || !shouldUpdateDestination) return;
			if (activeId !== idStr) {
				clearPendingMeasurement();
				return;
			}

			if (activeId === idStr && activeId !== previousActiveId) {
				queueOrFlushMeasurement();
			}
		},
		[
			enabled,
			group,
			idStr,
			shouldUpdateDestination,
			clearPendingMeasurement,
			queueOrFlushMeasurement,
		],
	);
};
