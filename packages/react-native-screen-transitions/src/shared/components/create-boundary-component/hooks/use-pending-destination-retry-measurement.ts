import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import type { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MaybeMeasureAndStoreParams } from "../types";

export const usePendingDestinationRetryMeasurement = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	currentScreenKey: string;
	expectedSourceScreenKey?: string;
	progress: ReturnType<typeof AnimationStore.getRouteAnimation>;
	animating: ReturnType<typeof AnimationStore.getRouteAnimation>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		enabled,
		currentScreenKey,
		expectedSourceScreenKey,
		progress,
		animating,
		maybeMeasureAndStore,
	} = params;

	const retryCount = useSharedValue(0);
	const MAX_RETRIES = 4;
	const RETRY_PROGRESS_BUCKETS = 8;
	const RETRY_PROGRESS_MAX = 1.05;

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return 0;
			if (retryCount.get() >= MAX_RETRIES) return 0;
			if (!animating.get()) return 0;
			if (BoundStore.hasDestinationLink(sharedBoundTag, currentScreenKey))
				return 0;

			const currentProgress = progress.get();
			if (currentProgress <= 0 || currentProgress >= RETRY_PROGRESS_MAX) {
				return 0;
			}

			const resolvedSourceKey = resolvePendingSourceKey(
				sharedBoundTag,
				expectedSourceScreenKey,
			);

			if (!resolvedSourceKey) return 0;
			if (
				!BoundStore.hasPendingLinkFromSource(sharedBoundTag, resolvedSourceKey)
			) {
				return 0;
			}

			const bucket = Math.floor(currentProgress * RETRY_PROGRESS_BUCKETS) + 1;
			return bucket;
		},
		(captureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!captureSignal) {
				retryCount.set(0);
				return;
			}

			if (retryCount.get() >= MAX_RETRIES) return;
			retryCount.set(retryCount.get() + 1);
			maybeMeasureAndStore({ shouldSetDestination: true });
		},
		[
			enabled,
			sharedBoundTag,
			currentScreenKey,
			expectedSourceScreenKey,
			progress,
			animating,
			maybeMeasureAndStore,
			retryCount,
		],
	);
};
