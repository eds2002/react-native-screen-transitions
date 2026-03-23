import {
	useAnimatedReaction,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { EPSILON } from "../../../constants";
import { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { GestureStore } from "../../../stores/gesture.store";
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
	currentScreenKey: string;
	shouldUpdateDestination: boolean;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		group,
		id,
		currentScreenKey,
		shouldUpdateDestination,
		maybeMeasureAndStore,
	} = params;
	const idStr = String(id);

	const allGroups = BoundStore.getGroups();
	const progress = AnimationStore.getValue(currentScreenKey, "progress");
	const animating = AnimationStore.getValue(currentScreenKey, "animating");
	const entering = AnimationStore.getValue(currentScreenKey, "entering");
	const closing = AnimationStore.getValue(currentScreenKey, "closing");
	const dragging = GestureStore.getValue(currentScreenKey, "dragging");
	const dismissing = GestureStore.getValue(currentScreenKey, "dismissing");
	const hasSettledOpenOnce = useSharedValue(false);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled || !shouldUpdateDestination) return false;
			return (
				progress.value >= 1 - EPSILON &&
				animating.value === 0 &&
				entering.value === 0 &&
				closing.value === 0 &&
				dragging.value === 0 &&
				dismissing.value === 0
			);
		},
		(isSettledOpen) => {
			"worklet";
			if (isSettledOpen) {
				hasSettledOpenOnce.value = true;
			}
		},
		[
			enabled,
			shouldUpdateDestination,
			progress,
			animating,
			entering,
			closing,
			dragging,
			dismissing,
			hasSettledOpenOnce,
		],
	);

	const isRefreshBlocked = useDerivedValue<number>(() => {
		"worklet";
		if (!enabled || !shouldUpdateDestination) return 0;
		if (!hasSettledOpenOnce.value) return 1;
		if (progress.value < 1 - EPSILON) return 1;
		if (animating.value !== 0) return 1;
		if (entering.value !== 0) return 1;
		if (closing.value !== 0) return 1;
		if (dragging.value !== 0) return 1;
		if (dismissing.value !== 0) return 1;
		return 0;
	});

	const { clearPendingMeasurement, queueOrFlushMeasurement } =
		useDeferredMeasurementTrigger({
			enabled,
			/**
			 * The reason to do extra guard checks for isAnimating is because a user may mid animation drag, causing
			 * the src component to be wrongly measured. This in turns leads to faulty src measurements being used, giving us a weird teleport
			 * animation rather than a smooth 'SET' transition when dst is actually dismissing.
			 */
			isAnimating: isRefreshBlocked,
			canFlush: () => {
				"worklet";
				return (
					canFlushGroupActiveMeasurement({
						enabled,
						isEligible: !!group && shouldUpdateDestination,
						memberId: idStr,
						activeId: group ? (allGroups.value[group]?.activeId ?? null) : null,
					}) && hasSettledOpenOnce.value
				);
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
				if (!hasSettledOpenOnce.value) {
					return;
				}
				queueOrFlushMeasurement();
			}
		},
		[
			enabled,
			group,
			idStr,
			currentScreenKey,
			shouldUpdateDestination,
			hasSettledOpenOnce,
			clearPendingMeasurement,
			queueOrFlushMeasurement,
		],
	);
};
