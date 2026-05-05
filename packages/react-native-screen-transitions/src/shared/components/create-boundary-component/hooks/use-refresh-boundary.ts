import { useAnimatedReaction } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { getGroupActiveId } from "../../../stores/bounds/internals/groups";
import { hasSourceLink } from "../../../stores/bounds/internals/registry";
import { GestureStore } from "../../../stores/gesture.store";
import type { BoundaryId, MeasureParams } from "../types";

interface UseRefreshBoundaryParams {
	enabled: boolean;
	sharedBoundTag: string;
	id: BoundaryId;
	group?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	hasNextScreen: boolean;
	measureBoundary: (options: MeasureParams) => void;
}

export const useRefreshBoundary = ({
	enabled,
	sharedBoundTag,
	id,
	group,
	currentScreenKey,
	nextScreenKey,
	hasNextScreen,
	measureBoundary,
}: UseRefreshBoundaryParams) => {
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

			const currentGroupActiveId = group ? getGroupActiveId(group) : null;

			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			const shouldCancelMeasurement =
				!!nextAnimating?.get() && !!nextDragging?.get();

			if (shouldCancelMeasurement) {
				return;
			}

			const hasSource = hasSourceLink(sharedBoundTag, currentScreenKey);

			const intent = !hasSource
				? "capture-source"
				: group
					? "refresh-source"
					: null;

			if (!intent) {
				return;
			}

			measureBoundary({ intent });
		},
	);

	useAnimatedReaction(
		() => (!hasNextScreen ? currentWillAnimate.get() : 0),
		(nextValue, previousValue) => {
			"worklet";
			if (!enabled || hasNextScreen) return;
			if (nextValue === 0 || nextValue === previousValue) return;

			const currentGroupActiveId = group ? getGroupActiveId(group) : null;

			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			const shouldCancelMeasurement =
				!!currentAnimating.get() && !!currentDragging.get();

			if (shouldCancelMeasurement) {
				return;
			}

			measureBoundary({
				intent: ["complete-destination", "refresh-destination"] as const,
			});
		},
	);
};
