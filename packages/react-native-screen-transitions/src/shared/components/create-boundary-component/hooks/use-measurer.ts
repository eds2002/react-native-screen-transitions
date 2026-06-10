import { useCallback } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import { setEntry } from "../../../stores/bounds/internals/entries";
import {
	setDestination,
	setSource,
} from "../../../stores/bounds/internals/links";
import { ScrollStore } from "../../../stores/scroll.store";
import { SystemStore } from "../../../stores/system.store";
import { getVisibilityBlockOffset } from "../../../utils/visibility-block-offset";
import type { MeasureBoundary } from "../types";
import {
	applyVisibilityBlockOffset,
	attachScrollSnapshotToMeasuredBounds,
	isMeasurementInViewport,
	measureWithOverscrollAwareness,
} from "../utils/measured-bounds";

interface UseMeasurerParams {
	enabled: boolean;
	entryTag: string;
	linkId: string;
	group?: string;
	currentScreenKey: string;
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<View>;
}

export const useMeasurer = ({
	enabled,
	entryTag,
	linkId,
	group,
	currentScreenKey,
	preparedStyles,
	measuredAnimatedRef,
}: UseMeasurerParams): MeasureBoundary => {
	const { width: viewportWidth, height: viewportHeight } =
		useWindowDimensions();

	const scrollState = ScrollStore.getValue(currentScreenKey, "coordination");
	const scrollMetadata = ScrollStore.getValue(currentScreenKey, "metadata");
	const pendingLifecycleStartBlockCount = SystemStore.getValue(
		currentScreenKey,
		"pendingLifecycleStartBlockCount",
	);

	return useCallback(
		(target) => {
			"worklet";
			if (!enabled) return;

			const measured = measureWithOverscrollAwareness(
				measuredAnimatedRef,
				scrollState.get(),
			);

			if (!measured) return;

			// Source boundaries do not need offset correction. Only destination
			// captures can measure while the visibility gate is still blocked.
			const shouldAdjustBlockedDestination =
				target.type === "destination" &&
				pendingLifecycleStartBlockCount.get() > 0;

			const normalizedMeasured = shouldAdjustBlockedDestination
				? applyVisibilityBlockOffset(
						measured,
						getVisibilityBlockOffset(viewportHeight),
					)
				: measured;

			/**
			 * - Destination Pass -
			 * Be strict while lifecycle start is blocked for destination capture.
			 * This is the initial attach window: the transition has not started yet,
			 * and malformed off-screen destination measurements should keep the
			 * lifecycle blocked until a valid retry lands.
			 */
			const shouldGuardDestinationViewport =
				pendingLifecycleStartBlockCount.get() > 0 || !!group;

			const viewportAllowsDestinationWrite =
				target.type !== "destination" ||
				!shouldGuardDestinationViewport ||
				isMeasurementInViewport(
					normalizedMeasured,
					viewportWidth,
					viewportHeight,
				);

			if (!viewportAllowsDestinationWrite) return;

			const measuredWithScroll = attachScrollSnapshotToMeasuredBounds(
				normalizedMeasured,
				scrollMetadata.get(),
			);

			// Set the bounds entry on every measure to avoid any stale measurements
			// for the public read API.
			setEntry(entryTag, currentScreenKey, {
				bounds: measuredWithScroll,
			});

			if (target.type === "source") {
				setSource(
					target.pairKey,
					linkId,
					currentScreenKey,
					measuredWithScroll,
					preparedStyles,
					group,
				);
			}

			if (target.type === "destination") {
				setDestination(
					target.pairKey,
					linkId,
					currentScreenKey,
					measuredWithScroll,
					preparedStyles,
					group,
				);
			}
		},
		[
			enabled,
			entryTag,
			linkId,
			group,
			currentScreenKey,
			preparedStyles,
			measuredAnimatedRef,
			viewportWidth,
			viewportHeight,
			scrollState,
			scrollMetadata,
			pendingLifecycleStartBlockCount,
		],
	);
};
