import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
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
	currentScreenKey: string;
	preferredSourceScreenKey?: string;
	ancestorScreenKeys: string[];
	measureBoundary: MeasureBoundary;
}

export const useInitialDestinationMeasurement = ({
	linkId,
	enabled,
	currentScreenKey,
	preferredSourceScreenKey,
	ancestorScreenKeys,
	measureBoundary,
}: UseInitialDestinationMeasurementParams) => {
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

			const destinationPairKey = getInitialDestinationMeasurePairKey({
				enabled,
				currentScreenKey,
				preferredSourceScreenKey,
				ancestorScreenKeys,
				linkId,
				linkState: ancestorScreenKeys.length ? pairs.get() : undefined,
			});

			return [destinationPairKey, retryTick] as const;
		},
		([destinationPairKey]) => {
			"worklet";
			if (!destinationPairKey) {
				releaseLifecycleStartBlock();
				return;
			}

			ensureLifecycleStartBlocked();
			measureBoundary({
				type: "destination",
				pairKey: destinationPairKey,
			});

			const destinationAttached =
				getDestination(destinationPairKey, linkId) !== null;

			if (destinationAttached) {
				releaseLifecycleStartBlock();
				return;
			}

			scheduleViewportRetry();
		},
	);
};
