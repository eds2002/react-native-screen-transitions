import { useAnimatedReaction } from "react-native-reanimated";
import type { MeasureParams } from "../types";

export const useInitialSourceMeasurement = (params: {
	enabled: boolean;
	nextScreenKey?: string;
	measureBoundary: (options: MeasureParams) => void;
}) => {
	const { enabled, nextScreenKey, measureBoundary } = params;

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled || !nextScreenKey) {
				return 0;
			}

			return nextScreenKey;
		},
		(captureSignal) => {
			"worklet";
			if (!enabled || !captureSignal) return;

			measureBoundary({ intent: "capture-source" });
		},
	);
};
