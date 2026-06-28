import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { pairs } from "../../../stores/bounds/internals/state";
import type { BoundTag } from "../../../stores/bounds/types";
import type { MeasureBoundary } from "../types";
import { getInitialSourceCaptureSignal } from "../utils/source-signals";

export const useInitialSourceMeasurement = (params: {
	enabled: boolean;
	measureBoundary: MeasureBoundary;
	boundTag: BoundTag;
	shouldAutoMeasure: boolean;
}) => {
	const { enabled, measureBoundary, boundTag, shouldAutoMeasure } = params;
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const lastSourceCaptureSignal = useSharedValue<string | null>(null);

	useAnimatedReaction(
		() => {
			"worklet";
			return getInitialSourceCaptureSignal({
				enabled,
				sourcePairKey,
				linkId: boundTag.linkKey,
				group: boundTag.group,
				shouldAutoMeasure,
				linkState: shouldAutoMeasure && sourcePairKey ? pairs.get() : undefined,
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
