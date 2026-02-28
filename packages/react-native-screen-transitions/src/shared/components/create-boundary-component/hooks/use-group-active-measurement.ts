import { useAnimatedReaction } from "react-native-reanimated";
import type { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";

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
	isAnimating: ReturnType<typeof AnimationStore.getRouteAnimation>;
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
			if (isAnimating.value) return;

			if (activeId === idStr && activeId !== previousActiveId) {
				maybeMeasureAndStore({ shouldUpdateDestination: true });
			}
		},
		[
			enabled,
			group,
			idStr,
			shouldUpdateDestination,
			isAnimating,
			maybeMeasureAndStore,
		],
	);
};
