import { useCallback, useLayoutEffect, useMemo } from "react";
import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { useBuilderStore } from "../../../providers/builder";
import { useOptionalScreenHostStore } from "../../../providers/host/screen-host.provider";
import {
	useMotionStore,
	useOptionalMotionStore,
} from "../../../providers/motion";
import type { BoundTag } from "../../../stores/bounds";
import {
	createScreenPairKey,
	getEntry,
	getLink,
	getMatchingSourceScreenKey,
	getSourceScreenKeyFromPairKey,
	pairs,
} from "../../../stores/bounds";
import { logger } from "../../../utils/logger";
import type { MeasureBoundary } from "../types";
import { getInitialDestinationMeasurementSignal } from "./destination-signals";
import type { OpeningScreen } from "./use-opening-screen";

// A missed layout is retried on the next frame: a longer interval visibly delays navigation on
// each ordinary Android layout miss.
const HANDSHAKE_RETRY_DELAY_MS = 16;
/**
 * A destination whose initial handshake never completes must not hold the
 * transition gate forever. After this budget, release the block with a warning
 * so the open proceeds without that boundary.
 */
const MAX_HANDSHAKE_RETRIES = 20;
const EMPTY_SCENES: never[] = [];

interface UseInitialDestinationMeasurementParams {
	boundTag: BoundTag;
	measureBoundary: MeasureBoundary;
	/** The transition that opens this screen (see useOpeningScreen). */
	opening: OpeningScreen;
}

export const useInitialDestinationMeasurement = ({
	boundTag,
	measureBoundary,
	opening,
}: UseInitialDestinationMeasurementParams) => {
	const { tag, linkKey, group } = boundTag;
	// The screen the boundary is on (what it is measured as), and the screen whose transition opens
	// it (whose pair it is the destination of, and whose start it holds until it is measured): the
	// same screen, or the ancestor that opens a nested stack this screen is the first of.
	const currentScreenKey = useBuilderStore(
		(s) => s.derivations.currentScreenKey,
	);
	const openingScreenKey = opening.screenKey;
	const destinationPairKey = opening.destinationPairKey;
	const destinationEnabled = opening.receiving;
	const canReceiveDestination = destinationEnabled && !!destinationPairKey;
	const preferredSourceScreenKey = destinationPairKey
		? getSourceScreenKeyFromPairKey(destinationPairKey)
		: undefined;
	const stackScenes = useOptionalScreenHostStore((store) =>
		canReceiveDestination ? (store?.scenes ?? EMPTY_SCENES) : EMPTY_SCENES,
	);
	// A retained closing screen can still have registered boundaries, but it
	// cannot own a new transition link.
	const closingSourceScreenKeys = useMemo(
		() =>
			stackScenes
				.filter((scene) => scene.activity === "closing")
				.map((scene) => scene.route.key),
		[stackScenes],
	);
	const ownProgress = useMotionStore((store) => store.state.transitionProgress);
	const ownActions = useMotionStore((store) => store.state.actions);
	const openingProgress = useOptionalMotionStore(
		openingScreenKey,
		(store) => store.state.transitionProgress,
	);
	const openingActions = useOptionalMotionStore(
		openingScreenKey,
		(store) => store.state.actions,
	);
	const progress = openingProgress ?? ownProgress;
	const { blockLifecycleStart, unblockLifecycleStart } =
		openingActions ?? ownActions;

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
			// This is an abandonment fallback, not a second release. Run it on the UI
			// runtime so it serializes with the handshake's guarded release.
			scheduleOnUI(releaseLifecycleStartBlock);
		};
	}, [
		claimLifecycleStartBlock,
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
				? createScreenPairKey(sourceScreenKey, openingScreenKey)
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

	// A screen whose previous screen changed under it while open (the screens between them removed
	// at once, as popToTop does) has no link with its new previous screen. It records its side of
	// that pair, and the boundary below measures its own (a pair awaiting its source asks for it), so
	// the element travels home as the screen closes instead of riding out with it.
	useAnimatedReaction(
		() => {
			"worklet";
			// Grouped boundaries (a pager) pick their active member in the handshake above.
			if (!canReceiveDestination || !destinationPairKey || group) return null;
			if (progress.get() <= 0) return null;
			const sourceScreenKey = getSourceScreenKeyFromPairKey(destinationPairKey);
			if (!sourceScreenKey || getEntry(tag, sourceScreenKey) === null)
				return null;
			if (getEntry(tag, currentScreenKey) === null) return null;
			const link = pairs.get()[destinationPairKey]?.links?.[linkKey];
			return link?.destination ? null : destinationPairKey;
		},
		(pairKey, previous) => {
			"worklet";
			if (!pairKey || pairKey === previous) return;
			measureBoundary({ type: "destination", pairKey });
		},
	);
};
