import { useCallback } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import { applyMeasuredBoundsWrites } from "../../../providers/helpers/measured-bounds-writes";
import type { BoundsPortalAttachTarget } from "../../../stores/bounds/types";
import { ScrollStore } from "../../../stores/scroll.store";
import { SystemStore } from "../../../stores/system.store";
import { getVisibilityBlockOffset } from "../../../utils/visibility-block-offset";
import { getActiveScrollHost } from "../portal/stores/host-registry.store";
import type { MeasureBoundary } from "../types";
import {
	attachScrollSnapshotToMeasuredBounds,
	isMeasurementInViewport,
	measureWithOverscrollAwareness,
	normalizeVisibilityBlockOffset,
} from "../utils/measured-bounds";

interface UseMeasurerParams {
	enabled: boolean;
	entryTag: string;
	linkId: string;
	group?: string;
	currentScreenKey: string;
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<View>;
	portalAttachTarget?: BoundsPortalAttachTarget;
}

export const useMeasurer = ({
	enabled,
	entryTag,
	linkId,
	group,
	currentScreenKey,
	preparedStyles,
	measuredAnimatedRef,
	portalAttachTarget,
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

			// Source captures are user-visible. Destination captures can happen
			// while the visibility gate is still physically translated offscreen,
			// so normalize only when the measured frame contains that block offset.
			const normalizedMeasured =
				target.type === "destination"
					? normalizeVisibilityBlockOffset(
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

			// Resolved at measure time so the recorded host matches the scroll
			// snapshot baked into these bounds.
			const sourceHost =
				target.type === "source"
					? (getActiveScrollHost(currentScreenKey) ?? undefined)
					: undefined;

			applyMeasuredBoundsWrites({
				entryTag,
				linkId,
				group,
				currentScreenKey,
				measured: measuredWithScroll,
				preparedStyles,
				linkWrite: target,
				portalAttachTarget,
				sourceHost,
			});
		},
		[
			enabled,
			entryTag,
			linkId,
			group,
			currentScreenKey,
			preparedStyles,
			measuredAnimatedRef,
			portalAttachTarget,
			viewportWidth,
			viewportHeight,
			scrollState,
			scrollMetadata,
			pendingLifecycleStartBlockCount,
		],
	);
};
