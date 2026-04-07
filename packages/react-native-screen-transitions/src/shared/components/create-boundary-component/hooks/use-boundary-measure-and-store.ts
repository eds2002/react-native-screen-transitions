import Animated, {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import { useLayoutAnchorContext } from "../../../providers/layout-anchor.provider";
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

	const layoutAnchor = useLayoutAnchorContext();

	return useStableCallbackValue(
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

			const correctedMeasured = layoutAnchor
				? layoutAnchor.correctMeasurement(measured)
				: measured;

			const destinationInViewport =
				!writePlan.wantsDestinationWrite ||
				!layoutAnchor ||
				!layoutAnchor.isMeasurementInViewport ||
				layoutAnchor.isMeasurementInViewport(correctedMeasured);

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
				!areMeasurementsEqual(existingSnapshot.bounds, correctedMeasured);
			const shouldWriteSnapshot = hasSnapshotChanged;

			applyMeasuredBoundsWrites({
				sharedBoundTag,
				currentScreenKey,
				measured: correctedMeasured,
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
	);
};
