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
	const currentClosing = AnimationStore.getValue(currentScreenKey, "closing");
	const currentDragging = GestureStore.getValue(currentScreenKey, "dragging");
	const currentEntering = AnimationStore.getValue(currentScreenKey, "entering");
	const nextWillAnimate = nextScreenKey
		? AnimationStore.getValue(nextScreenKey, "willAnimate")
		: null;

	const nextClosing = nextScreenKey
		? AnimationStore.getValue(nextScreenKey, "closing")
		: null;
	const nextDragging = nextScreenKey
		? GestureStore.getValue(nextScreenKey, "dragging")
		: null;
	const nextEntering = nextScreenKey
		? AnimationStore.getValue(nextScreenKey, "entering")
		: null;

	useAnimatedReaction(
		() => {
			"worklet";

			const shouldRefresh = hasNextScreen
				? (nextWillAnimate?.get() ?? 0)
				: currentWillAnimate.get();
			const closing = hasNextScreen
				? (nextClosing?.get() ?? 0)
				: currentClosing.get();
			const dragging = hasNextScreen
				? (nextDragging?.get() ?? 0)
				: currentDragging.get();
			const entering = hasNextScreen
				? (nextEntering?.get() ?? 0)
				: currentEntering.get();

			/*
	      This guard is here to essentially avoid remeasuring when the initial animation has not finished.
	      If we don't have this guard, we allow the user to measure a malformed
	      screen. (e.g. measuring a screen that is still being applied transformation styles). This
        guard should only apply when entering and dragging is true.

        NOTE: Could there possibly be an edge case where if we repeat this same flow, but instead of dragging a user presses a dismiss button?
        Could this guard possibly fail in this scenario?
			 */
			const hasUserInterruptedInitialAnimation = entering && dragging;

			if (shouldRefresh && !closing && !hasUserInterruptedInitialAnimation) {
				return 1;
			}

			return 0;
		},
		(shouldRefresh) => {
			"worklet";

			if (!enabled || !shouldRefresh) return;

			const currentGroupActiveId = group ? getGroupActiveId(group) : null;

			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			if (hasNextScreen) {
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
				return;
			}

			measureBoundary({
				intent: ["complete-destination", "refresh-destination"] as const,
			});
		},
	);
};
