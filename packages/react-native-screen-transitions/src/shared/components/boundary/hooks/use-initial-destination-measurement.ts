import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { AnimationStore } from "../../../stores/animation.store";
import { getDestination } from "../../../stores/bounds/internals/links";
import { pairs } from "../../../stores/bounds/internals/state";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../../stores/system.store";
import type { MeasureBoundary } from "../types";
import { getInitialDestinationMeasurePairKey } from "../utils/destination-signals";

const VIEWPORT_RETRY_DELAY_MS = 16;

interface UseInitialDestinationMeasurementParams {
	linkId: string;
	enabled: boolean;
	measureBoundary: MeasureBoundary;
}

export const useInitialDestinationMeasurement = ({
	linkId,
	enabled,
	measureBoundary,
}: UseInitialDestinationMeasurementParams) => {
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);
	const destinationPairKey = useDescriptorsStore(
		(s) => s.derivations.destinationPairKey,
	);
	const ancestorDestinationPairKey = useDescriptorsStore(
		(s) => s.derivations.ancestorDestinationPairKey,
	);
	const destinationEnabled = enabled && !nextScreenKey;
	const progress = AnimationStore.getValue(currentScreenKey, "progress");
	const system = SystemStore.getBag(currentScreenKey);
	const { pendingLifecycleRequestKind } = system;
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

			const hasPendingOpenRequest =
				pendingLifecycleRequestKind.get() ===
				LifecycleTransitionRequestKind.Open;

			const isWaitingForOpenToStart = progress.get() <= 0;

			if (!hasPendingOpenRequest || !isWaitingForOpenToStart) {
				return [0, retryTick] as const;
			}

			const measurePairKey = getInitialDestinationMeasurePairKey({
				enabled: destinationEnabled,
				destinationPairKey,
				ancestorDestinationPairKey,
				linkId,
				linkState:
					destinationEnabled &&
					(destinationPairKey || ancestorDestinationPairKey)
						? pairs.get()
						: undefined,
			});

			return [measurePairKey, retryTick] as const;
		},
		([measurePairKey]) => {
			"worklet";
			if (!measurePairKey) {
				releaseLifecycleStartBlock();
				return;
			}

			ensureLifecycleStartBlocked();
			measureBoundary({
				type: "destination",
				pairKey: measurePairKey,
			});

			const destinationAttached =
				getDestination(measurePairKey, linkId) !== null;

			if (destinationAttached) {
				releaseLifecycleStartBlock();
				return;
			}

			scheduleViewportRetry();
		},
	);
};
