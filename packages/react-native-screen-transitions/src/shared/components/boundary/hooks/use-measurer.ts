import { useCallback } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import { applyMeasuredBoundsWrites } from "../../../providers/helpers/measured-bounds-writes";
import { useScreenSlotStore } from "../../../providers/screen/styles";
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
}: UseMeasurerParams): MeasureBoundary => {
	const { width: viewportWidth, height: viewportHeight } =
		useWindowDimensions();

	const scrollState = ScrollStore.getValue(currentScreenKey, "coordination");
	const scrollMetadata = ScrollStore.getValue(currentScreenKey, "metadata");
	const screenSlotStore = useScreenSlotStore();
	const { visibilityBlocked } = screenSlotStore;

	return useCallback(
		(target) => {
			"worklet";
			if (!enabled) return false;

			const measured = measureWithOverscrollAwareness(
				measuredAnimatedRef,
				scrollState.get(),
			);

			if (!measured) return false;

			const correctedMeasured = correctMeasuredBoundsForVisibilityGate({
				measured,
				visibilityBlocked: visibilityBlocked.get(),
				visibilityBlockOffset: getVisibilityBlockOffset(viewportHeight),
				viewportWidth,
				viewportHeight,
			});

			if (escapeClipping && target.type === "source") {
				localMeasurement.set({
					bounds: measured,
					pairKey: target.pairKey,
				});
			}

			const viewportAllowsDestinationWrite =
				target.type !== "destination" ||
				isMeasurementInViewport(
					correctedMeasured,
					viewportWidth,
					viewportHeight,
				);

			if (!viewportAllowsDestinationWrite) return false;

			const measuredWithScroll = attachScrollSnapshotToMeasuredBounds(
				correctedMeasured,
				scrollMetadata.get(),
			);

			applyMeasuredBoundsWrites({
				entryTag: boundTag.tag,
				linkId: boundTag.linkKey,
				group: boundTag.group,
				currentScreenKey,
				measured: measuredWithScroll,
				preparedStyles,
				linkWrite: target,
				handoff,
				escapeClipping,
			});

			return true;
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
			viewportWidth,
			viewportHeight,
			scrollState,
			scrollMetadata,
			visibilityBlocked,
		],
	);
};
