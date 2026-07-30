import { useAnimatedReaction } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import { AnimationStore } from "../../../../stores/animation.store";
import {
	getPairKeyForDestination,
	getPairKeyForSource,
} from "../../../../stores/bounds/internals/links";
import { pairs } from "../../../../stores/bounds/internals/state";
import type { BoundTag } from "../../../../stores/bounds/types";
import type { MeasureBoundary } from "../../types";
import { getRefreshBoundarySignal } from "../../utils/refresh-signals";

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
	// Source-side boundaries refresh from the next screen's lifecycle pulse.
	// Destination-side boundaries have no next screen, so they refresh from self.
	const refreshScreenKey = nextScreenKey ?? currentScreenKey;
	const refreshWillAnimate = AnimationStore.getValue(
		refreshScreenKey,
		"willAnimate",
	);
	const refreshClosing = AnimationStore.getValue(refreshScreenKey, "closing");

	useAnimatedReaction(
		() => {
			"worklet";

			const shouldRefresh = enabled && !!refreshWillAnimate.get();
			if (!shouldRefresh) {
				return null;
			}
			const sourcePairKey =
				getPairKeyForSource(boundTag.tag, currentScreenKey) ?? undefined;
			const destinationPairKey =
				getPairKeyForDestination(boundTag.tag, currentScreenKey) ?? undefined;

			return getRefreshBoundarySignal({
				enabled,
				currentScreenKey,
				sourcePairKey,
				destinationPairKey,
				linkId: linkKey,
				group,
				shouldRefresh,
				closing: !!refreshClosing.get(),
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
