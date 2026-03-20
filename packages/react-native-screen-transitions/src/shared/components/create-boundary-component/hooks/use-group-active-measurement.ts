import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import {
	canFlushGroupActiveMeasurement,
	resolveGroupActiveMeasurementAction,
} from "./helpers/measurement-rules";
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
				return canFlushGroupActiveMeasurement({
					enabled,
					isEligible: !!group && shouldUpdateDestination,
					memberId: idStr,
					activeId: group ? (allGroups.value[group]?.activeId ?? null) : null,
				});
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
			const action = resolveGroupActiveMeasurementAction({
				enabled,
				isEligible: !!group && shouldUpdateDestination,
				memberId: idStr,
				activeId,
				previousActiveId,
			});

			if (action === "clear-pending") {
				clearPendingMeasurement();
				return;
			}

			if (action === "queue-or-flush") {
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
