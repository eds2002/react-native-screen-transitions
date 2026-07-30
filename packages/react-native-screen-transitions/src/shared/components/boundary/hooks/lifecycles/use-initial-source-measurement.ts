import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import { getPairKeyForSource } from "../../../../stores/bounds/internals/links";
import { pairs } from "../../../../stores/bounds/internals/state";
import type { BoundTag } from "../../../../stores/bounds/types";
import type { MeasureBoundary } from "../../types";
import { getInitialSourceCaptureSignal } from "../../utils/source-signals";

export const useInitialSourceMeasurement = (params: {
	enabled: boolean;
	measureBoundary: MeasureBoundary;
	boundTag: BoundTag;
}) => {
	const { enabled, measureBoundary, boundTag } = params;
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const lastSourceCaptureSignal = useSharedValue<string | null>(null);

	useAnimatedReaction(
		() => {
			"worklet";
			const sourcePairKey =
				getPairKeyForSource(boundTag.tag, currentScreenKey) ?? undefined;
			return getInitialSourceCaptureSignal({
				enabled,
				sourcePairKey,
				linkId: boundTag.linkKey,
				group: boundTag.group,
				linkState: sourcePairKey ? pairs.get() : undefined,
			});
		},
		(captureSignal) => {
			"worklet";
			if (!enabled || !captureSignal) {
				lastSourceCaptureSignal.set(null);
				return;
			}

			if (lastSourceCaptureSignal.get() === captureSignal.signal) {
				return;
			}

			lastSourceCaptureSignal.set(captureSignal.signal);
			measureBoundary({
				type: "source",
				pairKey: captureSignal.pairKey,
			});
		},
	);
};
