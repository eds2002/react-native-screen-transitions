import { useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { MaybeMeasureAndStoreParams } from "../types";
import { resolveAutoSourceCaptureSignal } from "./helpers/measurement-rules";

export const useAutoSourceMeasurement = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	nextScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { enabled, sharedBoundTag, nextScreenKey, maybeMeasureAndStore } =
		params;
	const boundaryPresence = BoundStore.getBoundaryPresence();

	useAnimatedReaction(
		() => {
			"worklet";
			return resolveAutoSourceCaptureSignal({
				enabled,
				nextScreenKey,
				tagPresence: boundaryPresence.value[sharedBoundTag],
			});
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!nextScreenKey) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) return;
			maybeMeasureAndStore({ intent: "capture-source" });
		},
		[
			enabled,
			nextScreenKey,
			sharedBoundTag,
			boundaryPresence,
			maybeMeasureAndStore,
		],
	);
};
