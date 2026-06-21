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
import { logger } from "../../../utils/logger";
import type { MeasureBoundary } from "../types";
import { getInitialDestinationMeasurePairKey } from "../utils/destination-signals";

const VIEWPORT_RETRY_DELAY_MS = 16;
/**
 * A destination that keeps failing its measurement guards must not hold the
 * transition gate forever — after this budget the block is released with a
 * warning so the open proceeds without that boundary.
 */
const MAX_VIEWPORT_RETRIES = 20;

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
	const progress = AnimationStore.getValue(
		currentScreenKey,
		"transitionProgress",
	);
	const system = SystemStore.getBag(currentScreenKey);
	const { pendingLifecycleRequestKind } = system;
	const { blockLifecycleStart, unblockLifecycleStart } = system.actions;
	const isBlockingLifecycleStart = useSharedValue(0);
	const retryToken = useSharedValue(0);
	const viewportRetries = useSharedValue(0);
	const hasGivenUp = useSharedValue(0);

	const releaseLifecycleStartBlock = () => {
		"worklet";
		cancelAnimation(retryToken);

		if (!isBlockingLifecycleStart.get()) {
			return;
		}

		unblockLifecycleStart();
		isBlockingLifecycleStart.set(0);
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
				viewportRetries.set(0);
				hasGivenUp.set(0);
				return;
			}

			if (hasGivenUp.get()) {
				return;
			}

			if (!isBlockingLifecycleStart.get()) {
				blockLifecycleStart();
				isBlockingLifecycleStart.set(1);
			}

			measureBoundary({
				type: "destination",
				pairKey: measurePairKey,
			});

			const destinationAttached =
				getDestination(measurePairKey, linkId) !== null;

			if (destinationAttached) {
				releaseLifecycleStartBlock();
				viewportRetries.set(0);
				return;
			}

			if (viewportRetries.get() >= MAX_VIEWPORT_RETRIES) {
				hasGivenUp.set(1);
				releaseLifecycleStartBlock();
				logger.warn(
					`Destination boundary "${linkId}" never produced a valid measurement after ${MAX_VIEWPORT_RETRIES} attempts; releasing the transition gate without it. The boundary is likely off-viewport (e.g. an inactive group member on a paged screen) or unmounted.`,
				);
				return;
			}

			// Destination did not attach (malformed off-screen measurement); retry
			// on the next tick while the lifecycle stays blocked.
			viewportRetries.set(viewportRetries.get() + 1);
			cancelAnimation(retryToken);
			retryToken.set(
				withDelay(
					VIEWPORT_RETRY_DELAY_MS,
					withTiming(retryToken.get() + 1, { duration: 0 }),
				),
			);
		},
	);
};
