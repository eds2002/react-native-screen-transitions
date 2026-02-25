import { useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MaybeMeasureAndStoreParams } from "../types";

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
			if (!enabled) return 0;
			const resolvedSourceKey = resolvePendingSourceKey(
				sharedBoundTag,
				expectedSourceScreenKey,
			);
			if (!resolvedSourceKey) return 0;

			return BoundStore.hasPendingLinkFromSource(
				sharedBoundTag,
				resolvedSourceKey,
			)
				? resolvedSourceKey
				: 0;
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) {
				return;
			}

			maybeMeasureAndStore({ shouldSetDestination: true });
		},
		[enabled, sharedBoundTag, expectedSourceScreenKey, maybeMeasureAndStore],
	);
};
