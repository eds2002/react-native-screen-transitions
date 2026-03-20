import { useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MaybeMeasureAndStoreParams } from "../types";
import { resolvePendingDestinationCaptureSignal } from "./helpers/measurement-rules";

export const usePendingDestinationMeasurement = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	expectedSourceScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		enabled,
		expectedSourceScreenKey,
		maybeMeasureAndStore,
	} = params;

	useAnimatedReaction(
		() => {
			"worklet";
			const resolvedSourceKey = resolvePendingSourceKey(
				sharedBoundTag,
				expectedSourceScreenKey,
			);
			return resolvePendingDestinationCaptureSignal({
				enabled,
				resolvedSourceKey,
				hasPendingLinkFromSource: resolvedSourceKey
					? BoundStore.hasPendingLinkFromSource(
							sharedBoundTag,
							resolvedSourceKey,
						)
					: false,
			});
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) {
				return;
			}

			maybeMeasureAndStore({ intent: "complete-destination" });
		},
		[enabled, sharedBoundTag, expectedSourceScreenKey, maybeMeasureAndStore],
	);
};
