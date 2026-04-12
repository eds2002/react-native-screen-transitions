import { useCallback } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import { applyMeasuredBoundsWrites } from "../../../stores/bounds/helpers/apply-measured-bounds-writes";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MaybeMeasureAndStoreParams } from "../types";
import {
	getMeasurementIntentFlags,
	resolveMeasurementWritePlan,
} from "./helpers/measurement-rules";

const SNAPSHOT_EPSILON = 0.5;

const areMeasurementsEqual = (
	a: MeasuredDimensions,
	b: MeasuredDimensions,
): boolean => {
	"worklet";

	return (
		Math.abs(a.x - b.x) <= SNAPSHOT_EPSILON &&
		Math.abs(a.y - b.y) <= SNAPSHOT_EPSILON &&
		Math.abs(a.pageX - b.pageX) <= SNAPSHOT_EPSILON &&
		Math.abs(a.pageY - b.pageY) <= SNAPSHOT_EPSILON &&
		Math.abs(a.width - b.width) <= SNAPSHOT_EPSILON &&
		Math.abs(a.height - b.height) <= SNAPSHOT_EPSILON
	);
};

const isMeasurementInViewport = (
	measured: MeasuredDimensions,
	viewportWidth: number,
	viewportHeight: number,
): boolean => {
	"worklet";

	if (measured.width <= 0 || measured.height <= 0) {
		return false;
	}

	const toleranceX = viewportWidth * 0.15;
	const toleranceY = viewportHeight * 0.15;
	const centerX = measured.pageX + measured.width / 2;
	const centerY = measured.pageY + measured.height / 2;

	return (
		centerX >= -toleranceX &&
		centerX <= viewportWidth + toleranceX &&
		centerY >= -toleranceY &&
		centerY <= viewportHeight + toleranceY
	);
};

export const useBoundaryMeasureAndStore = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	preferredSourceScreenKey?: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	navigatorKey?: string;
	ancestorNavigatorKeys?: string[];
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<Animated.View>;
}) => {
	const {
		enabled,
		sharedBoundTag,
		preferredSourceScreenKey,
		currentScreenKey,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
		preparedStyles,
		measuredAnimatedRef,
	} = params;
	const { width: viewportWidth, height: viewportHeight } =
		useWindowDimensions();

	return useCallback(
		({ intent }: MaybeMeasureAndStoreParams = {}) => {
			"worklet";
			if (!enabled) return;

			const intents = getMeasurementIntentFlags(intent);

			const expectedSourceScreenKey: string | undefined =
				resolvePendingSourceKey(sharedBoundTag, preferredSourceScreenKey) ||
				undefined;

			const hasPendingLink = expectedSourceScreenKey
				? BoundStore.hasPendingLinkFromSource(
						sharedBoundTag,
						expectedSourceScreenKey,
					)
				: BoundStore.hasPendingLink(sharedBoundTag);
			const hasAttachableSourceLink = expectedSourceScreenKey
				? BoundStore.hasSourceLink(sharedBoundTag, expectedSourceScreenKey)
				: false;
			const hasSourceLink = BoundStore.hasSourceLink(
				sharedBoundTag,
				currentScreenKey,
			);
			const hasDestinationLink = BoundStore.hasDestinationLink(
				sharedBoundTag,
				currentScreenKey,
			);

			const writePlan = resolveMeasurementWritePlan({
				intents,
				hasPendingLink,
				hasSourceLink,
				hasDestinationLink,
				hasAttachableSourceLink,
			});

			if (!writePlan.writesAny) {
				return;
			}

			const measured = measure(measuredAnimatedRef);
			if (!measured) return;

			const destinationInViewport =
				!writePlan.wantsDestinationWrite ||
				isMeasurementInViewport(measured, viewportWidth, viewportHeight);

			if (
				!destinationInViewport &&
				!writePlan.captureSource &&
				!writePlan.refreshSource
			) {
				return;
			}

			const existingSnapshot = BoundStore.getSnapshot(
				sharedBoundTag,
				currentScreenKey,
			);
			const hasSnapshotChanged =
				!existingSnapshot ||
				!areMeasurementsEqual(existingSnapshot.bounds, measured);
			const shouldWriteSnapshot = hasSnapshotChanged;

			applyMeasuredBoundsWrites({
				sharedBoundTag,
				currentScreenKey,
				measured,
				preparedStyles,
				ancestorKeys,
				navigatorKey,
				ancestorNavigatorKeys,
				expectedSourceScreenKey,
				shouldRegisterSnapshot: shouldWriteSnapshot,
				shouldSetSource: writePlan.captureSource,
				shouldUpdateSource: writePlan.refreshSource && hasSnapshotChanged,
				shouldUpdateDestination:
					writePlan.refreshDestination &&
					destinationInViewport &&
					hasSnapshotChanged,
				shouldSetDestination:
					writePlan.completeDestination && destinationInViewport,
			});
		},
		[
			enabled,
			sharedBoundTag,
			preferredSourceScreenKey,
			currentScreenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			preparedStyles,
			measuredAnimatedRef,
			viewportWidth,
			viewportHeight,
		],
	);
};
