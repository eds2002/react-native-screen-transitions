import { useAnimatedReaction } from "react-native-reanimated";
import { useBuilderStore } from "../../../../providers/screen/builder";
import { useOptionalMotionStore } from "../../../../providers/screen/motion";
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
	const currentScreenKey = useBuilderStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useBuilderStore((s) => s.derivations.nextScreenKey);
	// Source-side boundaries refresh from the next screen's lifecycle pulse.
	// Destination-side boundaries have no next screen, so they refresh from self.
	const refreshScreenKey = nextScreenKey ?? currentScreenKey;
	const willAnimate = useOptionalMotionStore(
		refreshScreenKey,
		(store) => store.state.willAnimate,
	);
	const progressSettled = useOptionalMotionStore(
		refreshScreenKey,
		(store) => store.state.progressSettled,
	);
	const closing = useOptionalMotionStore(
		refreshScreenKey,
		(store) => store.state.closing,
	);

	useAnimatedReaction(
		() => {
			"worklet";

			if (!enabled || !willAnimate || !progressSettled || !closing) return null;

			const shouldRefresh = !!willAnimate.get();
			const settled = !!progressSettled.get();
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
				closing: !!closing.get(),
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
