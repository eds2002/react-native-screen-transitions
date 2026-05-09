import { useCallback } from "react";
import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import type { AnimatedRef, StyleProps } from "react-native-reanimated";
import { ScrollStore } from "../../../stores/scroll.store";
import { SystemStore } from "../../../stores/system.store";
import { applyMeasuredBoundsWrites } from "../helpers/apply-measured-bounds-writes";
import type { MeasureParams } from "../types";
import { createLinkContext } from "./helpers/boundary-link-context";
import { isMeasurementInViewport } from "./helpers/measurement";
import {
	buildMeasurementWritePlan,
	getMeasureIntentFlags,
} from "./helpers/measurement-rules";
import { measureWithOverscrollAwareness } from "./helpers/scroll-measurement";

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

	const scrollState = ScrollStore.getValue(currentScreenKey, "state");
	const pendingLifecycleStartBlockCount = SystemStore.getValue(
		currentScreenKey,
		"pendingLifecycleStartBlockCount",
	);

	return useCallback(
		({ intent }: MeasureParams = {}) => {
			"worklet";
			if (!enabled) return;

			const intents = getMeasureIntentFlags(intent);
			const currentLink = createLinkContext({
				sharedBoundTag,
				currentScreenKey,
				preferredSourceScreenKey,
			});

			const writePlan = buildMeasurementWritePlan({
				intents,
				hasPendingLink: currentLink.hasPendingLink,
				hasSourceLink: currentLink.hasSourceLink,
				hasDestinationLink: currentLink.hasDestinationLink,
				hasAttachableSourceLink: currentLink.hasAttachableSourceLink,
			});

			if (!writePlan.writesAny) return;

			const measured = measureWithOverscrollAwareness(
				measuredAnimatedRef,
				scrollState.get(),
			);

			if (!measured) return;

			/**
			 * Source Pass
			 * Source intents are intentionally used & kept unguarded.
			 */
			const sourceWrites = {
				shouldSetSource: writePlan.captureSource,
				shouldUpdateSource: writePlan.refreshSource,
			};

			/**
			 * - Destination Pass -
			 * Be strict while lifecycle start is blocked for destination capture.
			 * This is the initial attach window: the transition has not started yet,
			 * and malformed off-screen destination measurements should keep the
			 * lifecycle blocked until a valid retry lands.
			 */
			const shouldGuardDestinationViewport =
				pendingLifecycleStartBlockCount.get() > 0;
			const viewportAllowsDestinationWrite =
				!shouldGuardDestinationViewport ||
				isMeasurementInViewport(measured, viewportWidth, viewportHeight);

			const destinationWrites = {
				shouldSetDestination:
					viewportAllowsDestinationWrite && writePlan.completeDestination,
				shouldUpdateDestination:
					viewportAllowsDestinationWrite && writePlan.refreshDestination,
			};

			const shouldApplyMeasurement =
				sourceWrites.shouldSetSource ||
				sourceWrites.shouldUpdateSource ||
				destinationWrites.shouldSetDestination ||
				destinationWrites.shouldUpdateDestination;

			if (!shouldApplyMeasurement) return;

			applyMeasuredBoundsWrites({
				sharedBoundTag,
				currentScreenKey,
				measured,
				preparedStyles,
				ancestorKeys,
				navigatorKey,
				ancestorNavigatorKeys,
				expectedSourceScreenKey: currentLink.expectedSourceScreenKey,
				...sourceWrites,
				...destinationWrites,
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
			scrollState,
			pendingLifecycleStartBlockCount,
		],
	);
};
