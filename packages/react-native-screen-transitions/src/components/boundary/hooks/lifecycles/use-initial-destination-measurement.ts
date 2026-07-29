import { useCallback, useLayoutEffect, useMemo } from "react";
import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { useStack } from "../../../../hooks/navigation/use-stack";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import { AnimationStore } from "../../../../stores/animation.store";
import {
	createScreenPairKey,
	getSourceScreenKeyFromPairKey,
} from "../../../../stores/bounds/helpers/link-pairs.helpers";
import {
	getEntry,
	getMatchingSourceScreenKey,
} from "../../../../stores/bounds/internals/entries";
import { getLink } from "../../../../stores/bounds/internals/links";
import { pairs } from "../../../../stores/bounds/internals/state";
import type { BoundTag } from "../../../../stores/bounds/types";
import { SystemStore } from "../../../../stores/system.store";
import { logger } from "../../../../utils/logger";
import type { MeasureBoundary } from "../../types";
import { getInitialDestinationMeasurementSignal } from "../../utils/destination-signals";

// A missed layout should be retried on the next frame. The previous 100 ms
// interval made each ordinary Android layout miss visibly delay navigation.
const HANDSHAKE_RETRY_DELAY_MS = 16;
/**
 * A destination whose initial handshake never completes must not hold the
 * transition gate forever. After this budget, release the block with a warning
 * so the open proceeds without that boundary.
 */
const MAX_HANDSHAKE_RETRIES = 20;

interface UseInitialDestinationMeasurementParams {
	boundTag: BoundTag;
	enabled: boolean;
	escapeClipping: boolean;
	measureBoundary: MeasureBoundary;
}

export const useInitialDestinationMeasurement = ({
	boundTag,
	enabled,
	escapeClipping,
	measureBoundary,
}: UseInitialDestinationMeasurementParams) => {
	const { tag, linkKey, group } = boundTag;
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);
	const destinationPairKey = useDescriptorsStore(
		(s) => s.derivations.destinationPairKey,
	);
	const destinationEnabled = enabled && !nextScreenKey;
	const canReceiveDestination = destinationEnabled && !!destinationPairKey;
	const preferredSourceScreenKey = destinationPairKey
		? getSourceScreenKeyFromPairKey(destinationPairKey)
		: undefined;
	const stackScenes = useStack((store) => store.scenes);
	// A retained closing screen can still have registered boundaries, but it
	// cannot own a new transition link.
	const closingSourceScreenKeys = useMemo(
		() =>
			stackScenes
				.filter((scene) => scene.activity === "closing")
				.map((scene) => scene.route.key),
		[stackScenes],
	);
	const progress = AnimationStore.getValue(
		currentScreenKey,
		"transitionProgress",
	);

	const {
		actions: { blockLifecycleStart, unblockLifecycleStart },
	} = SystemStore.getBag(currentScreenKey);

	const isBlockingLifecycleStart = useSharedValue(0);
	const retryToken = useSharedValue(0);
	const handshakeRetries = useSharedValue(0);
	const hasGivenUp = useSharedValue(0);
	const hasFinishedInitialMeasurement = useSharedValue(0);

	const releaseLifecycleStartBlock = useCallback(() => {
		"worklet";
		cancelAnimation(retryToken);

		if (!isBlockingLifecycleStart.get()) {
			return;
		}

		hasFinishedInitialMeasurement.set(1);
		isBlockingLifecycleStart.set(0);
		unblockLifecycleStart();
	}, [
		hasFinishedInitialMeasurement,
		isBlockingLifecycleStart,
		retryToken,
		unblockLifecycleStart,
	]);

	const claimLifecycleStartBlock = useCallback(() => {
		"worklet";
		if (
			!canReceiveDestination ||
			hasFinishedInitialMeasurement.get() ||
			!getMatchingSourceScreenKey(tag, currentScreenKey)
		) {
			return;
		}

		// The progress check and block claim must share one UI-thread operation.
		// Otherwise a JS-thread layout effect can observe zero, enqueue the block,
		// and let the opening animation start before that block reaches the UI thread.
		if (progress.get() > 0 || isBlockingLifecycleStart.get()) {
			return;
		}

		blockLifecycleStart();
		isBlockingLifecycleStart.set(1);
	}, [
		blockLifecycleStart,
		canReceiveDestination,
		currentScreenKey,
		hasFinishedInitialMeasurement,
		isBlockingLifecycleStart,
		progress,
		tag,
	]);

	useLayoutEffect(() => {
		if (!canReceiveDestination) {
			return;
		}

		scheduleOnUI(claimLifecycleStartBlock);

		return () => {
			if (escapeClipping) {
				// The portal host owns the release after this boundary hands off.
				return;
			}

			// This is an abandonment fallback, not a second release. Run it on the UI
			// runtime so it serializes with the handshake's guarded release.
			scheduleOnUI(releaseLifecycleStartBlock);
		};
	}, [
		claimLifecycleStartBlock,
		escapeClipping,
		canReceiveDestination,
		releaseLifecycleStartBlock,
	]);

	useAnimatedReaction(
		() => {
			"worklet";

			if (
				!canReceiveDestination ||
				hasFinishedInitialMeasurement.get() ||
				isBlockingLifecycleStart.get() <= 0
			) {
				return null;
			}

			if (progress.get() > 0) {
				return null;
			}

			const retryTick = retryToken.get();
			const sourceScreenKey = getMatchingSourceScreenKey(
				tag,
				currentScreenKey,
				preferredSourceScreenKey,
				closingSourceScreenKeys,
			);
			const pairKey = sourceScreenKey
				? createScreenPairKey(sourceScreenKey, currentScreenKey)
				: undefined;
			const signal = getInitialDestinationMeasurementSignal({
				enabled: destinationEnabled,
				pairKey,
				linkId: linkKey,
				group,
				destinationPresent: getEntry(tag, currentScreenKey) !== null,
				sourcePresent: sourceScreenKey !== null,
				linkState: pairs.get(),
			});

			return [
				signal?.pairKey ?? null,
				signal?.action ?? null,
				retryTick,
			] as const;
		},
		(next, previous) => {
			"worklet";
			if (!next || hasFinishedInitialMeasurement.get()) {
				return;
			}

			const [measurePairKey, action, retryTick] = next;
			if (!action) {
				return;
			}

			const previousMeasurePairKey = previous?.[0];
			const previousAction = previous?.[1];
			const previousRetryTick = previous?.[2];
			const shouldHandleSignal =
				measurePairKey !== previousMeasurePairKey ||
				action !== previousAction ||
				retryTick !== previousRetryTick;

			if (!shouldHandleSignal) {
				return;
			}

			if (hasGivenUp.get()) {
				return;
			}

			if (action === "release") {
				releaseLifecycleStartBlock();
				handshakeRetries.set(0);
				return;
			}

			if (action === "measure" && measurePairKey) {
				measureBoundary({
					type: "destination",
					pairKey: measurePairKey,
				});
			}

			const link = measurePairKey ? getLink(measurePairKey, linkKey) : null;
			const linkComplete = !!link?.source && !!link.destination;

			if (linkComplete || action === "complete") {
				cancelAnimation(retryToken);
				handshakeRetries.set(0);
				hasFinishedInitialMeasurement.set(1);
				if (escapeClipping) {
					// Screen-level escape has a second readiness phase after destination
					// matching: the host must commit before the transition starts, or
					// the payload can disappear for a frame.
					return;
				}
				releaseLifecycleStartBlock();
				return;
			}

			if (handshakeRetries.get() >= MAX_HANDSHAKE_RETRIES) {
				hasGivenUp.set(1);
				releaseLifecycleStartBlock();
				logger.warn(
					`Boundary "${linkKey}" never formed a complete source/destination link after ${MAX_HANDSHAKE_RETRIES} attempts; releasing the transition gate without it. One side is likely off-viewport or unmounted.`,
				);
				return;
			}

			// Keep the lifecycle blocked while registration, measurement, or source
			// attachment settles. The retry token also retries rejected destination bounds.
			handshakeRetries.set(handshakeRetries.get() + 1);
			cancelAnimation(retryToken);
			retryToken.set(
				withDelay(
					HANDSHAKE_RETRY_DELAY_MS,
					withTiming(retryToken.get() + 1, { duration: 0 }),
				),
			);
		},
	);
};
