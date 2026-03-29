import { useAnimatedReaction } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { GestureStore } from "../../../stores/gesture.store";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import {
	PREPARE_DESTINATION_MEASUREMENT_INTENT,
	resolvePrepareSourceMeasurementIntent,
} from "./helpers/measurement-rules";

export const usePrepareTransitionMeasurement = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	id: BoundaryId;
	group?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	hasNextScreen: boolean;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		sharedBoundTag,
		id,
		group,
		currentScreenKey,
		nextScreenKey,
		hasNextScreen,
		maybeMeasureAndStore,
	} = params;

	const currentWillAnimate = AnimationStore.getValue(
		currentScreenKey,
		"willAnimate",
	);
	const currentAnimating = AnimationStore.getValue(
		currentScreenKey,
		"animating",
	);
	const currentDragging = GestureStore.getValue(currentScreenKey, "dragging");
	const nextWillAnimate = nextScreenKey
		? AnimationStore.getValue(nextScreenKey, "willAnimate")
		: null;
	const nextAnimating = nextScreenKey
		? AnimationStore.getValue(nextScreenKey, "animating")
		: null;
	const nextDragging = nextScreenKey
		? GestureStore.getValue(nextScreenKey, "dragging")
		: null;

	useAnimatedReaction(
		() => (hasNextScreen ? (nextWillAnimate?.get() ?? 0) : 0),
		(nextValue, previousValue) => {
			"worklet";
			if (!enabled || !hasNextScreen) return;
			if (nextValue === 0 || nextValue === previousValue) return;

			const currentGroupActiveId = group
				? BoundStore.getGroupActiveId(group)
				: null;

			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			const shouldCancelMeasurement =
				!!nextAnimating?.get() && !!nextDragging?.get();
			if (shouldCancelMeasurement) {
				return;
			}

			const intent = resolvePrepareSourceMeasurementIntent({
				hasSourceLink: BoundStore.hasSourceLink(
					sharedBoundTag,
					currentScreenKey,
				),
			});

			maybeMeasureAndStore({ intent });
		},
	);

	useAnimatedReaction(
		() => (!hasNextScreen ? currentWillAnimate.get() : 0),
		(nextValue, previousValue) => {
			"worklet";
			if (!enabled || hasNextScreen) return;
			if (nextValue === 0 || nextValue === previousValue) return;
			const currentGroupActiveId = group
				? BoundStore.getGroupActiveId(group)
				: null;
			if (group && currentGroupActiveId !== String(id)) return;

			const shouldCancelMeasurement =
				!!currentAnimating.get() && !!currentDragging.get();
			if (shouldCancelMeasurement) return;

			maybeMeasureAndStore({
				intent: PREPARE_DESTINATION_MEASUREMENT_INTENT,
			});
		},
	);
};
