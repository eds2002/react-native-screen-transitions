import { useCallback } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useMotionStore } from "../../../providers/motion";
import { useScrollChain } from "../../../providers/motion/gestures/scroll-coordination";
import { setEntry } from "../../../stores/bounds/internals/entries";
import {
	setDestination,
	setSource,
} from "../../../stores/bounds/internals/links";
import type { BoundTag } from "../../../stores/bounds/types";
import { ScrollStore } from "../../../stores/scroll.store";
import { getVisibilityBlockOffset } from "../../../utils/visibility-block-offset";
import type { BoundaryLocalMeasurementValue, MeasureBoundary } from "../types";
import {
	attachScrollSnapshotToMeasuredBounds,
	correctMeasuredBoundsForVisibilityGate,
	isMeasurementInViewport,
	measureWithOverscrollAwareness,
} from "../utils/measured-bounds";

interface UseMeasurerParams {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: string;
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<View>;
	handoff: boolean;
	escapeClipping: boolean;
	localMeasurement: BoundaryLocalMeasurementValue;
	onFirstEscapeMeasure: () => void;
}

export const useMeasurer = ({
	enabled,
	boundTag,
	currentScreenKey,
	preparedStyles,
	measuredAnimatedRef,
	handoff,
	escapeClipping,
	localMeasurement,
	onFirstEscapeMeasure,
}: UseMeasurerParams): MeasureBoundary => {
	const { width: viewportWidth, height: viewportHeight } =
		useWindowDimensions();

	const scrollState = ScrollStore.getValue(currentScreenKey, "coordination");
	const scrollMetadata = ScrollStore.getValue(currentScreenKey, "metadata");
	const scrollChain = useScrollChain();
	const pendingLifecycleStartBlockCount = useMotionStore(
		(store) => store.state.pendingLifecycleStartBlockCount,
	);
	const isScreenReady = useMotionStore((store) => store.isScreenReady);

	return useCallback(
		(target) => {
			"worklet";
			if (!enabled) return;

			const measured = measureWithOverscrollAwareness(
				measuredAnimatedRef,
				scrollState.get(),
			);

			if (!measured) return;

			const correctedMeasured = correctMeasuredBoundsForVisibilityGate({
				measured,
				isScreenReady: isScreenReady.get(),
				visibilityBlockOffset: getVisibilityBlockOffset(viewportHeight),
				viewportWidth,
				viewportHeight,
			});

			/**
			 * - Destination Pass -
			 * Be strict while lifecycle start is blocked for destination capture.
			 * This is the initial attach window: the transition has not started yet,
			 * and malformed off-screen destination measurements should keep the
			 * lifecycle blocked until a valid retry lands.
			 */
			const shouldGuardDestinationViewport =
				pendingLifecycleStartBlockCount.get() > 0 || !!boundTag.group;

			const viewportAllowsDestinationWrite =
				target.type !== "destination" ||
				!shouldGuardDestinationViewport ||
				isMeasurementInViewport(
					correctedMeasured,
					viewportWidth,
					viewportHeight,
				);

			if (!viewportAllowsDestinationWrite) return;

			const measuredWithScroll = attachScrollSnapshotToMeasuredBounds(
				correctedMeasured,
				scrollMetadata.get(),
				scrollChain,
			);

			// Handoff can render into the destination boundary's escape host too.
			// Capture only accepted geometry, correcting the destination visibility gate. The scroll
			// snapshot lets the escaped frame follow its scroll views while it is in the overlay.
			if (escapeClipping) {
				// The first measurement is what gives this boundary a host in the overlay.
				if (localMeasurement.get() === null) scheduleOnRN(onFirstEscapeMeasure);
				localMeasurement.set({
					bounds: measuredWithScroll,
					pairKey: target.pairKey,
				});
			}

			// Refresh the public bounds entry on every accepted measurement.
			setEntry(boundTag.tag, currentScreenKey, { bounds: measuredWithScroll });

			if (target.type === "source") {
				setSource(
					target.pairKey,
					boundTag.linkKey,
					currentScreenKey,
					measuredWithScroll,
					preparedStyles,
					boundTag.group,
					{ handoff, escapeClipping },
				);
			}

			if (target.type === "destination") {
				setDestination(
					target.pairKey,
					boundTag.linkKey,
					currentScreenKey,
					measuredWithScroll,
					preparedStyles,
					boundTag.group,
					{ handoff },
				);
			}
		},
		[
			enabled,
			boundTag,
			currentScreenKey,
			preparedStyles,
			measuredAnimatedRef,
			handoff,
			escapeClipping,
			localMeasurement,
			onFirstEscapeMeasure,
			viewportWidth,
			viewportHeight,
			scrollState,
			scrollMetadata,
			scrollChain,
			pendingLifecycleStartBlockCount,
			isScreenReady,
		],
	);
};
