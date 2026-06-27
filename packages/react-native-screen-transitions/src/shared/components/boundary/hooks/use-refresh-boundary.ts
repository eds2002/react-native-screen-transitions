import { useAnimatedReaction } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { AnimationStore } from "../../../stores/animation.store";
import { pairs } from "../../../stores/bounds/internals/state";
import type { BoundTag } from "../../../stores/bounds/types";
import type { MeasureBoundary } from "../types";
import { getRefreshBoundarySignal } from "../utils/refresh-signals";

interface UseRefreshBoundaryParams {
	enabled: boolean;
	boundTag: BoundTag;
	measureBoundary: MeasureBoundary;
}

export const useRefreshBoundary = ({
	enabled,
	boundTag,
	measureBoundary,
}: UseRefreshBoundaryParams) => {
	const { linkKey, group } = boundTag;
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const destinationPairKey = useDescriptorsStore(
		(s) => s.derivations.destinationPairKey,
	);
	const ancestorDestinationPairKey = useDescriptorsStore(
		(s) => s.derivations.ancestorDestinationPairKey,
	);
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
	const refreshProgress = AnimationStore.getValue(
		refreshScreenKey,
		"transitionProgress",
	);

	useAnimatedReaction(
		() => {
			"worklet";
			return getRefreshBoundarySignal({
				enabled,
				currentScreenKey,
				sourcePairKey,
				destinationPairKey,
				ancestorDestinationPairKey,
				nextScreenKey,
				linkId: linkKey,
				group,
				shouldRefresh: !!refreshWillAnimate.get(),
				closing: !!refreshClosing.get(),
				entering: !!refreshEntering.get(),
				animating: !!refreshAnimating.get(),
				progress: refreshProgress.get(),
				linkState: pairs.get(),
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
