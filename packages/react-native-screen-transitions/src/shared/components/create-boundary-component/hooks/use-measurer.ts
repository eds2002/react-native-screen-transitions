import { useCallback } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import {
	type AnimatedRef,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import { applyMeasuredBoundsWrites } from "../../../stores/bounds/helpers/apply-measured-bounds-writes";
import {
	getMeasuredEntry,
	getPendingLink,
	hasDestinationLink,
	hasSourceLink,
} from "../../../stores/bounds/internals/registry";
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
				? getPendingLink(sharedBoundTag, expectedSourceScreenKey)
				: getPendingLink(sharedBoundTag);
			const hasPendingLink = pendingLink !== null;
			const hasAttachableSourceLink = expectedSourceScreenKey
				? hasSourceLink(sharedBoundTag, expectedSourceScreenKey)
				: false;
			const hasSource = hasSourceLink(sharedBoundTag, currentScreenKey);
			const hasDestination = hasDestinationLink(
				sharedBoundTag,
				currentScreenKey,
			);

			const writePlan = resolveMeasureWritePlan({
				intents,
				hasPendingLink,
				hasSourceLink: hasSource,
				hasDestinationLink: hasDestination,
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

			const existingMeasuredEntry = getMeasuredEntry(
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
