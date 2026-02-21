import { useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds.store";
import type { BoundaryMode, MaybeMeasureAndStoreParams } from "../types";

export const useAutoSourceMeasurement = (params: {
	enabled: boolean;
	mode?: BoundaryMode;
	sharedBoundTag: string;
	nextScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const { enabled, mode, sharedBoundTag, nextScreenKey, maybeMeasureAndStore } =
		params;
	const boundaryPresence = BoundStore.getBoundaryPresence();

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return 0;
			if (mode === "destination") return 0;
			if (!nextScreenKey) return 0;
			if (mode === "source") return nextScreenKey;
			const tagPresence = boundaryPresence.value[sharedBoundTag];
			if (!tagPresence) return 0;

			const direct = tagPresence[nextScreenKey];
			if (direct && direct.count > 0) return nextScreenKey;

			for (const screenKey in tagPresence) {
				const entry = tagPresence[screenKey];
				if (entry.ancestorKeys?.includes(nextScreenKey)) {
					return nextScreenKey;
				}
			}

			return 0;
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (mode === "destination") return;
			if (!nextScreenKey) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) return;
			maybeMeasureAndStore({ shouldSetSource: true });
		},
		[
			enabled,
			mode,
			nextScreenKey,
			sharedBoundTag,
			boundaryPresence,
			maybeMeasureAndStore,
		],
	);
};
