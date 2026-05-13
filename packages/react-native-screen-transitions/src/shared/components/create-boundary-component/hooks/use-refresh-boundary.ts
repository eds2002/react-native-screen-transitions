import { useAnimatedReaction } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { getGroupActiveId } from "../../../stores/bounds/internals/groups";
import {
	hasDestinationLink,
	hasSourceLink,
} from "../../../stores/bounds/internals/links";
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
	const currentEntering = AnimationStore.getValue(currentScreenKey, "entering");
	const currentAnimating = AnimationStore.getValue(
		currentScreenKey,
		"progressAnimating",
	);
	const currentProgress = AnimationStore.getValue(currentScreenKey, "progress");
	const nextWillAnimate = nextScreenKey
		? AnimationStore.getValue(nextScreenKey, "willAnimate")
		: null;

	const nextClosing = nextScreenKey
		? AnimationStore.getValue(nextScreenKey, "closing")
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
			const entering = hasNextScreen
				? (nextEntering?.get() ?? 0)
				: currentEntering.get();

			// Programmatic close marks `closing` before pulsing `willAnimate`.
			// This frame is still settled, so destination refresh is valid and
			// reveal can compute initial/current destination delta before progress moves.
			const canRefreshPreCloseDestination =
				!hasNextScreen &&
				shouldRefresh &&
				closing &&
				!entering &&
				!currentAnimating.get() &&
				currentProgress.get() >= 1;

			if (
				canRefreshPreCloseDestination ||
				(shouldRefresh && !closing && !entering)
			) {
				return 1;
			}

			return 0;
		},
		(shouldRefresh, prevShouldRefresh) => {
			"worklet";

			if (!enabled || !shouldRefresh || shouldRefresh === prevShouldRefresh)
				return;

			const currentGroupActiveId = group ? getGroupActiveId(group) : null;

			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			if (hasNextScreen) {
				if (
					!nextScreenKey ||
					!hasSourceLink(sharedBoundTag, currentScreenKey) ||
					!hasDestinationLink(sharedBoundTag, nextScreenKey)
				) {
					return;
				}

				measureBoundary({ intent: "refresh-source" });
				return;
			}

			measureBoundary({
				intent: "refresh-destination",
			});
		},
	);
};
