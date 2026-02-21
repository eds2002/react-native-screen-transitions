import { useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds.store";
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
			if (expectedSourceScreenKey) {
				const resolvedSourceKey = BoundStore.hasPendingLinkFromSource(
					sharedBoundTag,
					expectedSourceScreenKey,
				)
					? expectedSourceScreenKey
					: BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag);

				if (!resolvedSourceKey) return 0;

				return BoundStore.hasPendingLinkFromSource(
					sharedBoundTag,
					resolvedSourceKey,
				)
					? resolvedSourceKey
					: 0;
			}

			const latestPendingSource =
				BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag);
			if (!latestPendingSource) return 0;

			return BoundStore.hasPendingLinkFromSource(
				sharedBoundTag,
				latestPendingSource,
			)
				? latestPendingSource
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
