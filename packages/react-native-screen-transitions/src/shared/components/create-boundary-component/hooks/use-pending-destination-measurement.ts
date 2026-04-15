import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { SystemStore } from "../../../stores/system.store";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import { resolvePendingDestinationCaptureSignal } from "./helpers/measurement-rules";

/**
 * Blocks lifecycle start while a destination boundary still needs its first
 * valid measurement pair. If the first destination measure is still outside the
 * viewport, it keeps retrying on a short UI-thread delay until a valid
 * destination link attaches, then releases the pending lifecycle request.
 */
const VIEWPORT_RETRY_DELAY_MS = 16;

export const usePendingDestinationMeasurement = (params: {
	sharedBoundTag: string;
	enabled: boolean;
	id: BoundaryId;
	group?: string;
	currentScreenKey: string;
	expectedSourceScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		sharedBoundTag,
		enabled,
		id,
		group,
		currentScreenKey,
		expectedSourceScreenKey,
		maybeMeasureAndStore,
	} = params;

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
			if (closing.get()) {
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

			const shouldBlock = !!resolvePendingDestinationCaptureSignal({
				enabled,
				resolvedSourceKey,
				hasAttachableSourceLink,
				hasDestinationLink: BoundStore.hasDestinationLink(
					sharedBoundTag,
					currentScreenKey,
				),
			});

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
			maybeMeasureAndStore({ intent: "complete-destination" });

			if (BoundStore.hasDestinationLink(sharedBoundTag, currentScreenKey)) {
				releaseLifecycleStartBlock();
				return;
			}

			scheduleViewportRetry();
		},
	);
};
