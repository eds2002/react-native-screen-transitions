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
	const refreshSettled = AnimationStore.getValue(
		refreshScreenKey,
		"progressSettled",
	);
	const refreshClosing = AnimationStore.getValue(refreshScreenKey, "closing");

	useAnimatedReaction(
		() => {
			"worklet";

			if (!enabled) return null;

			const shouldRefresh = !!refreshWillAnimate.get();
			const settled = !!refreshSettled.get();
			// A group's active member can change while the transition is settled
			// (for example, paging a destination gallery). Let that member publish
			// fresh bounds even though there is no willAnimate lifecycle pulse yet.
			if (!shouldRefresh && (!group || !settled)) {
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
				settled,
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
