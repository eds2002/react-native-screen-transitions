import { useLayoutEffect } from "react";
import {
	runOnUI,
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import {
	resolvePendingDestinationCaptureSignal,
	resolvePendingDestinationRetrySignal,
} from "./helpers/measurement-rules";

export const usePendingDestinationMeasurement = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	id: BoundaryId;
	group?: string;
	currentScreenKey: string;
	expectedSourceScreenKey?: string;
	animating: SharedValue<number>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		enabled,
		id,
		group,
		currentScreenKey,
		expectedSourceScreenKey,
		animating,
		maybeMeasureAndStore,
	} = params;

	const progress = AnimationStore.getValue(currentScreenKey, "progress");
	const closing = AnimationStore.getValue(currentScreenKey, "closing");

	const retryCount = useSharedValue(0);
	const MAX_RETRIES = 4;
	const RETRY_PROGRESS_BUCKETS = 8;
	const RETRY_PROGRESS_MAX = 1.05;

	useLayoutEffect(() => {
		if (!enabled) return;

		runOnUI(() => {
			"worklet";
			if (closing.get()) {
				return;
			}

			const currentGroupActiveId = group
				? BoundStore.getGroupActiveId(group)
				: null;
			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			const resolvedSourceKey = resolvePendingSourceKey(
				sharedBoundTag,
				expectedSourceScreenKey,
			);
			const hasAttachableSourceLink = resolvedSourceKey
				? BoundStore.hasPendingLinkFromSource(
						sharedBoundTag,
						resolvedSourceKey,
					) || BoundStore.hasSourceLink(sharedBoundTag, resolvedSourceKey)
				: false;

			if (!hasAttachableSourceLink) {
				return;
			}

			if (BoundStore.hasDestinationLink(sharedBoundTag, currentScreenKey)) {
				return;
			}

			maybeMeasureAndStore({ intent: "complete-destination" });
		})();
	}, [
		enabled,
		id,
		group,
		sharedBoundTag,
		currentScreenKey,
		expectedSourceScreenKey,
		closing,
		maybeMeasureAndStore,
	]);

	useAnimatedReaction(
		() => {
			"worklet";
			if (closing.get()) {
				return 0;
			}
			const resolvedSourceKey = resolvePendingSourceKey(
				sharedBoundTag,
				expectedSourceScreenKey,
			);
			return resolvePendingDestinationCaptureSignal({
				enabled,
				resolvedSourceKey,
				hasAttachableSourceLink: resolvedSourceKey
					? BoundStore.hasPendingLinkFromSource(
							sharedBoundTag,
							resolvedSourceKey,
						) || BoundStore.hasSourceLink(sharedBoundTag, resolvedSourceKey)
					: false,
				hasDestinationLink: BoundStore.hasDestinationLink(
					sharedBoundTag,
					currentScreenKey,
				),
			});
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) {
				return;
			}
			const currentGroupActiveId = group
				? BoundStore.getGroupActiveId(group)
				: null;
			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			maybeMeasureAndStore({ intent: "complete-destination" });
		},
		[
			enabled,
			id,
			group,
			sharedBoundTag,
			expectedSourceScreenKey,
			closing,
			maybeMeasureAndStore,
		],
	);

	useAnimatedReaction(
		() => {
			"worklet";
			if (closing.get()) {
				return 0;
			}
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
				hasAttachableSourceLink: resolvedSourceKey
					? BoundStore.hasPendingLinkFromSource(
							sharedBoundTag,
							resolvedSourceKey,
						) || BoundStore.hasSourceLink(sharedBoundTag, resolvedSourceKey)
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
			const currentGroupActiveId = group
				? BoundStore.getGroupActiveId(group)
				: null;
			if (group && currentGroupActiveId !== String(id)) {
				return;
			}

			if (retryCount.get() >= MAX_RETRIES) return;
			retryCount.set(retryCount.get() + 1);
			maybeMeasureAndStore({ intent: "complete-destination" });
		},
		[
			enabled,
			id,
			group,
			sharedBoundTag,
			currentScreenKey,
			expectedSourceScreenKey,
			progress,
			animating,
			closing,
			maybeMeasureAndStore,
			retryCount,
		],
	);
};
