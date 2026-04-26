import { useCallback } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import {
	type AnimatedRef,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import { applyMeasuredBoundsWrites } from "../../../stores/bounds/helpers/apply-measured-bounds-writes";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MeasureParams } from "../types";
import {
	areMeasurementsEqual,
	isMeasurementInViewport,
} from "./helpers/measurement";
import {
	getMeasureIntentFlags,
	resolveMeasureWritePlan,
} from "./helpers/measurement-rules";

interface UseMeasurerParams {
	enabled: boolean;
	sharedBoundTag: string;
	preferredSourceScreenKey?: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	navigatorKey?: string;
	ancestorNavigatorKeys?: string[];
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<View>;
}

export const useMeasurer = ({
	enabled,
	sharedBoundTag,
	preferredSourceScreenKey,
	currentScreenKey,
	ancestorKeys,
	navigatorKey,
	ancestorNavigatorKeys,
	preparedStyles,
	measuredAnimatedRef,
}: UseMeasurerParams) => {
	const { width: viewportWidth, height: viewportHeight } =
		useWindowDimensions();

	return useCallback(
		({ intent }: MeasureParams = {}) => {
			"worklet";
			if (!enabled) return;

			const intents = getMeasureIntentFlags(intent);

			const expectedSourceScreenKey: string | undefined =
				resolvePendingSourceKey(sharedBoundTag, preferredSourceScreenKey) ||
				undefined;

			const pendingLink = expectedSourceScreenKey
				? BoundStore.link.getPending(sharedBoundTag, expectedSourceScreenKey)
				: BoundStore.link.getPending(sharedBoundTag);
			const hasPendingLink = pendingLink !== null;
			const hasAttachableSourceLink = expectedSourceScreenKey
				? BoundStore.link.hasSource(sharedBoundTag, expectedSourceScreenKey)
				: false;
			const hasSourceLink = BoundStore.link.hasSource(
				sharedBoundTag,
				currentScreenKey,
			);
			const hasDestinationLink = BoundStore.link.hasDestination(
				sharedBoundTag,
				currentScreenKey,
			);

			const writePlan = resolveMeasureWritePlan({
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

			const existingMeasuredEntry = BoundStore.entry.getMeasured(
				sharedBoundTag,
				currentScreenKey,
			);
			const hasMeasuredEntryChanged =
				!existingMeasuredEntry ||
				!areMeasurementsEqual(existingMeasuredEntry.bounds, measured);

			applyMeasuredBoundsWrites({
				sharedBoundTag,
				currentScreenKey,
				measured,
				preparedStyles,
				ancestorKeys,
				navigatorKey,
				ancestorNavigatorKeys,
				expectedSourceScreenKey,
				shouldWriteEntry: hasMeasuredEntryChanged,
				shouldSetSource: writePlan.captureSource,
				shouldUpdateSource: writePlan.refreshSource && hasMeasuredEntryChanged,
				shouldUpdateDestination:
					writePlan.refreshDestination &&
					destinationInViewport &&
					hasMeasuredEntryChanged,
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
