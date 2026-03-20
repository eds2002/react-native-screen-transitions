import {
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MaybeMeasureAndStoreParams } from "../types";
import { resolvePendingDestinationRetrySignal } from "./helpers/measurement-rules";

export const usePendingDestinationRetryMeasurement = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	currentScreenKey: string;
	expectedSourceScreenKey?: string;
	progress: SharedValue<number>;
	animating: SharedValue<number>;
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
			const resolvedSourceKey = resolvePendingSourceKey(
				sharedBoundTag,
				expectedSourceScreenKey,
			);
			return resolvePendingDestinationRetrySignal({
				enabled,
				retryCount: retryCount.get(),
				maxRetries: MAX_RETRIES,
				isAnimating: !!animating.get(),
				hasDestinationLink: BoundStore.hasDestinationLink(
					sharedBoundTag,
					currentScreenKey,
				),
				progress: progress.get(),
				retryProgressMax: RETRY_PROGRESS_MAX,
				retryProgressBuckets: RETRY_PROGRESS_BUCKETS,
				resolvedSourceKey,
				hasPendingLinkFromSource: resolvedSourceKey
					? BoundStore.hasPendingLinkFromSource(
							sharedBoundTag,
							resolvedSourceKey,
						)
					: false,
			});
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
			maybeMeasureAndStore({ intent: "complete-destination" });
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
