import { useLayoutEffect } from "react";
import {
	cancelAnimation,
	runOnUI,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { SystemStore } from "../../../stores/system.store";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { BoundaryId, MeasureParams } from "../types";

const VIEWPORT_RETRY_DELAY_MS = 16;

interface UseCaptureDestinationBoundaryParams {
	sharedBoundTag: string;
	enabled: boolean;
	id: BoundaryId;
	group?: string;
	currentScreenKey: string;
	expectedSourceScreenKey?: string;
	measureBoundary: (options: MeasureParams) => void;
}

export const useCaptureDestinationBoundary = ({
	sharedBoundTag,
	enabled,
	id,
	group,
	currentScreenKey,
	expectedSourceScreenKey,
	measureBoundary,
}: UseCaptureDestinationBoundaryParams) => {
	const animating = AnimationStore.getValue(currentScreenKey, "animating");
	const closing = AnimationStore.getValue(currentScreenKey, "closing");
	const system = SystemStore.getBag(currentScreenKey);
	const { blockLifecycleStart, unblockLifecycleStart } = system.actions;
	const isBlockingLifecycleStart = useSharedValue(0);
	const retryToken = useSharedValue(0);

	const ensureLifecycleStartBlocked = () => {
		"worklet";
		if (isBlockingLifecycleStart.get()) {
			return;
		}

		blockLifecycleStart();
		isBlockingLifecycleStart.set(1);
	};

	const releaseLifecycleStartBlock = () => {
		"worklet";
		cancelAnimation(retryToken);

		if (!isBlockingLifecycleStart.get()) {
			return;
		}

		unblockLifecycleStart();
		isBlockingLifecycleStart.set(0);
	};

	const scheduleViewportRetry = () => {
		"worklet";
		cancelAnimation(retryToken);
		retryToken.set(
			withDelay(
				VIEWPORT_RETRY_DELAY_MS,
				withTiming(retryToken.get() + 1, { duration: 0 }),
			),
		);
	};

	useAnimatedReaction(
		() => {
			"worklet";
			const retryTick = retryToken.get();

			if (closing.get() || animating.get()) {
				return [0, retryTick] as const;
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
			const hasDestinationLink = BoundStore.hasDestinationLink(
				sharedBoundTag,
				currentScreenKey,
			);

			const shouldBlock =
				enabled &&
				!!resolvedSourceKey &&
				hasAttachableSourceLink &&
				!hasDestinationLink;

			if (!shouldBlock) {
				return [0, retryTick] as const;
			}

			if (group && BoundStore.getGroupActiveId(group) !== String(id)) {
				return [0, retryTick] as const;
			}

			return [1, retryTick] as const;
		},
		([shouldBlock]) => {
			"worklet";
			if (!shouldBlock) {
				releaseLifecycleStartBlock();
				return;
			}

			ensureLifecycleStartBlocked();
			measureBoundary({ intent: "complete-destination" });

			if (BoundStore.hasDestinationLink(sharedBoundTag, currentScreenKey)) {
				releaseLifecycleStartBlock();
				return;
			}

			scheduleViewportRetry();
		},
	);

	useLayoutEffect(() => {
		return () => {
			runOnUI(() => {
				"worklet";
				cancelAnimation(retryToken);

				if (!isBlockingLifecycleStart.get()) {
					return;
				}

				unblockLifecycleStart();
				isBlockingLifecycleStart.set(0);
			})();
		};
	}, [isBlockingLifecycleStart, retryToken, unblockLifecycleStart]);
};
