import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { AnimationStore } from "../../../stores/animation.store";
import {
	getDestination,
	getLink,
} from "../../../stores/bounds/internals/links";
import { pairs } from "../../../stores/bounds/internals/state";
import type { BoundTag } from "../../../stores/bounds/types";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../../stores/system.store";
import { logger } from "../../../utils/logger";
import type { MeasureBoundary } from "../types";
import { getInitialDestinationMeasurePairKey } from "../utils/destination-signals";

const VIEWPORT_RETRY_DELAY_MS = 100;
/**
 * A destination that keeps failing its measurement guards must not hold the
 * transition gate forever — after this budget the block is released with a
 * warning so the open proceeds without that boundary.
 */
const MAX_VIEWPORT_RETRIES = 20;

interface UseInitialDestinationMeasurementParams {
	boundTag: BoundTag;
	enabled: boolean;
	measureBoundary: MeasureBoundary;
}

export const useInitialDestinationMeasurement = ({
	boundTag,
	enabled,
	measureBoundary,
}: UseInitialDestinationMeasurementParams) => {
	const { linkKey, group } = boundTag;
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

	const {
		pendingLifecycleRequestKind,
		actions: { blockLifecycleStart, unblockLifecycleStart },
	} = SystemStore.getBag(currentScreenKey);

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
				linkId: linkKey,
				group,
				linkState:
					destinationEnabled &&
					(destinationPairKey || ancestorDestinationPairKey)
						? pairs.get()
						: undefined,
			});

			return [measurePairKey, retryTick] as const;
		},
		([measurePairKey, retryTick], previous) => {
			"worklet";
			if (!measurePairKey) {
				return;
			}

			const previousMeasurePairKey = previous?.[0];
			const previousRetryTick = previous?.[1];
			const shouldAttemptMeasure =
				measurePairKey !== previousMeasurePairKey ||
				retryTick !== previousRetryTick;

			if (!shouldAttemptMeasure) {
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
				getDestination(measurePairKey, linkKey) !== null;

			if (destinationAttached) {
				const link = getLink(measurePairKey, linkKey);
				if (link?.source?.portalAttachTarget === "matched-screen") {
					// Matched-screen portals have a second readiness phase after
					// destination measurement. The destination boundary can measure
					// before its portal host has rendered, but teleporting into that
					// host early can draw the source in the wrong coordinate space for
					// a frame. Keep the lifecycle gate blocked here; the portal host
					// layout is the visual commit point that releases it.
					return;
				}
				releaseLifecycleStartBlock();
				viewportRetries.set(0);
				return;
			}

			if (viewportRetries.get() >= MAX_VIEWPORT_RETRIES) {
				hasGivenUp.set(1);
				releaseLifecycleStartBlock();
				logger.warn(
					`Destination boundary "${linkKey}" never produced a valid measurement after ${MAX_VIEWPORT_RETRIES} attempts; releasing the transition gate without it. The boundary is likely off-viewport (e.g. an inactive group member on a paged screen) or unmounted.`,
				);
				return;
			}

			// Destination did not attach (malformed off-screen measurement); retry
			// after the retry token advances while the lifecycle stays blocked.
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
