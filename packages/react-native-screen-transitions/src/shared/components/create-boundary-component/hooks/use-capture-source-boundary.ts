import { useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MeasureParams } from "../types";

export const useCaptureSourceBoundary = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	id: BoundaryId;
	group?: string;
	nextScreenKey?: string;
	measureBoundary: (options: MeasureParams) => void;
}) => {
	const { enabled, id, group, nextScreenKey, measureBoundary } = params;

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled || !nextScreenKey) {
				return 0;
			}

			return nextScreenKey;
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!nextScreenKey) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) return;

			const currentGroupActiveId = group
				? BoundStore.getGroupActiveId(group)
				: null;

			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			measureBoundary({ intent: "capture-source" });
		},
		[enabled, id, group, nextScreenKey, measureBoundary],
	);
};
