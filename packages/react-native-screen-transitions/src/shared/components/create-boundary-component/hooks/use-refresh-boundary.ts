import { useAnimatedReaction } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { pairs } from "../../../stores/bounds/internals/state";
import type { MeasureBoundary } from "../types";
import { getRefreshBoundarySignal } from "../utils/refresh-signals";

interface UseRefreshBoundaryParams {
	enabled: boolean;
	currentScreenKey: string;
	preferredSourceScreenKey?: string;
	nextScreenKey?: string;
	linkId: string;
	group?: string;
	ancestorScreenKeys: string[];
	measureBoundary: MeasureBoundary;
}

export const useRefreshBoundary = ({
	enabled,
	currentScreenKey,
	preferredSourceScreenKey,
	nextScreenKey,
	linkId,
	group,
	ancestorScreenKeys,
	measureBoundary,
}: UseRefreshBoundaryParams) => {
	// Source-side boundaries refresh from the next screen's lifecycle pulse.
	// Destination-side boundaries have no next screen, so they refresh from self.
	const refreshScreenKey = nextScreenKey ?? currentScreenKey;
	const refreshWillAnimate = AnimationStore.getValue(
		refreshScreenKey,
		"willAnimate",
	);
	const refreshClosing = AnimationStore.getValue(refreshScreenKey, "closing");
	const refreshEntering = AnimationStore.getValue(refreshScreenKey, "entering");
	const refreshAnimating = AnimationStore.getValue(
		refreshScreenKey,
		"progressAnimating",
	);
	const refreshProgress = AnimationStore.getValue(refreshScreenKey, "progress");

	useAnimatedReaction(
		() => {
			"worklet";
			return getRefreshBoundarySignal({
				enabled,
				currentScreenKey,
				preferredSourceScreenKey,
				nextScreenKey,
				linkId,
				group,
				ancestorScreenKeys,
				shouldRefresh: !!refreshWillAnimate.get(),
				closing: !!refreshClosing.get(),
				entering: !!refreshEntering.get(),
				animating: !!refreshAnimating.get(),
				progress: refreshProgress.get(),
				linkState: group || ancestorScreenKeys.length ? pairs.get() : undefined,
			});
		},
		(refreshSignal, prevRefreshSignal) => {
			"worklet";

			if (
				!refreshSignal ||
				refreshSignal.signal === prevRefreshSignal?.signal
			) {
				return;
			}

			measureBoundary({
				type: refreshSignal.type,
				pairKey: refreshSignal.pairKey,
			});
		},
	);
};
