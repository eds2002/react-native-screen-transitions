import type { View } from "react-native";
import { useWindowDimensions } from "react-native";
import {
	type AnimatedRef,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import { BoundStore } from "../../../stores/bounds";
import { applyMeasuredBoundsWrites } from "../../../stores/bounds/helpers/apply-measured-bounds-writes";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MeasureParams } from "../types";
import {
	areMeasurementsEqual,
	isMeasurementInViewport,
} from "./helpers/measurement";
import {
	getMeasurementIntentFlags,
	resolveMeasurementWritePlan,
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

	return useStableCallbackValue(({ intent }: MeasureParams = {}) => {
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

		applyMeasuredBoundsWrites({
			sharedBoundTag,
			currentScreenKey,
			measured,
			preparedStyles,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			expectedSourceScreenKey,
			shouldRegisterSnapshot: hasSnapshotChanged,
			shouldSetSource: writePlan.captureSource,
			shouldUpdateSource: writePlan.refreshSource && hasSnapshotChanged,
			shouldUpdateDestination:
				writePlan.refreshDestination &&
				destinationInViewport &&
				hasSnapshotChanged,
			shouldSetDestination:
				writePlan.completeDestination && destinationInViewport,
		});
	});
};
