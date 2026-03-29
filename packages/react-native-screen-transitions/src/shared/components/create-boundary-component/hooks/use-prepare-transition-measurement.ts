import { useAnimatedReaction } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
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
	const nextWillAnimate = nextScreenKey
		? AnimationStore.getValue(nextScreenKey, "willAnimate")
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

			if (currentGroupActiveId !== String(id)) {
				return;
			}

			const intent = resolvePrepareSourceMeasurementIntent({
				hasSourceLink: BoundStore.hasSourceLink(
					sharedBoundTag,
					currentScreenKey,
				),
			});

			maybeMeasureAndStore({ intent, preferLiveMeasure: true });
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
			if (currentGroupActiveId !== String(id)) return;

			maybeMeasureAndStore({
				intent: PREPARE_DESTINATION_MEASUREMENT_INTENT,
			});
		},
	);
};
