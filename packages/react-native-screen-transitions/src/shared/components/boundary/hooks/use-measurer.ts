import { useCallback } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import {
	type AnimatedRef,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import { applyMeasuredBoundsWrites } from "../../../providers/helpers/measured-bounds-writes";
import { useOriginContext } from "../../../providers/screen/origin.provider";
import type {
	BoundsPortalAttachTarget,
	BoundTag,
} from "../../../stores/bounds/types";
import { ScrollStore } from "../../../stores/scroll.store";
import { SystemStore } from "../../../stores/system.store";
import { getActiveScrollHost } from "../portal/stores/host-registry.store";
import type { MeasureBoundary } from "../types";
import {
	attachScrollSnapshotToMeasuredBounds,
	isMeasurementInViewport,
	measureWithOverscrollAwareness,
	normalizeMeasuredBoundsToOrigin,
} from "../utils/measured-bounds";

interface UseMeasurerParams {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: string;
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<View>;
	portalHost?: BoundsPortalAttachTarget;
}

export const useMeasurer = ({
	enabled,
	boundTag,
	currentScreenKey,
	preparedStyles,
	measuredAnimatedRef,
	portalHost,
}: UseMeasurerParams): MeasureBoundary => {
	const { width: viewportWidth, height: viewportHeight } =
		useWindowDimensions();

	const scrollState = ScrollStore.getValue(currentScreenKey, "coordination");
	const scrollMetadata = ScrollStore.getValue(currentScreenKey, "metadata");
	const pendingLifecycleStartBlockCount = SystemStore.getValue(
		currentScreenKey,
		"pendingLifecycleStartBlockCount",
	);
	const { originRef } = useOriginContext();

	return useCallback(
		(target) => {
			"worklet";
			if (!enabled) return;

			const measured = measureWithOverscrollAwareness(
				measuredAnimatedRef,
				scrollState.get(),
			);
			const measuredOrigin = measure(originRef);

			if (!measured || !measuredOrigin) return;

			const normalizedMeasured = normalizeMeasuredBoundsToOrigin(
				measured,
				measuredOrigin,
			);

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
					normalizedMeasured,
					viewportWidth,
					viewportHeight,
				);

			if (!viewportAllowsDestinationWrite) return;

			const measuredWithScroll = attachScrollSnapshotToMeasuredBounds(
				normalizedMeasured,
				scrollMetadata.get(),
			);
			const sourceHost =
				target.type === "source"
					? (getActiveScrollHost(currentScreenKey) ?? undefined)
					: undefined;

			applyMeasuredBoundsWrites({
				entryTag: boundTag.tag,
				linkId: boundTag.linkKey,
				group: boundTag.group,
				currentScreenKey,
				measured: measuredWithScroll,
				preparedStyles,
				linkWrite: target,
				portalHost,
				sourceHost,
			});
		},
		[
			enabled,
			boundTag,
			currentScreenKey,
			preparedStyles,
			measuredAnimatedRef,
			portalHost,
			viewportWidth,
			viewportHeight,
			scrollState,
			scrollMetadata,
			pendingLifecycleStartBlockCount,
			originRef,
		],
	);
};
