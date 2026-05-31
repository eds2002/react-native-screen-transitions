import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { pairs } from "../../../stores/bounds/internals/state";
import type { MeasureBoundary } from "../types";
import { getInitialSourceCaptureSignal } from "../utils/source-signals";

export const useInitialSourceMeasurement = (params: {
	enabled: boolean;
	nextScreenKey?: string;
	currentScreenKey?: string;
	measureBoundary: MeasureBoundary;
	linkId: string;
	group?: string;
	shouldAutoMeasure: boolean;
}) => {
	const {
		enabled,
		nextScreenKey,
		measureBoundary,
		linkId,
		currentScreenKey,
		group,
		shouldAutoMeasure,
	} = params;
	const lastSourceCaptureSignal = useSharedValue<string | null>(null);

	useAnimatedReaction(
		() => {
			"worklet";
			return getInitialSourceCaptureSignal({
				enabled,
				nextScreenKey,
				currentScreenKey,
				linkId,
				group,
				shouldAutoMeasure,
				linkState: group ? pairs.get() : undefined,
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
