import type { View } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
	type SharedValue,
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
	isAnimating: SharedValue<number>;
	preparedStyles: StyleProps;
	measuredAnimatedRef: AnimatedRef<View>;
}) => {
	const {
		enabled,
		sharedBoundTag,
		preferredSourceScreenKey,
		currentScreenKey,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
		isAnimating,
		preparedStyles,
		measuredAnimatedRef,
	} = params;

	const layoutAnchor = useLayoutAnchorContext();

	return useStableCallbackValue(
		({
			intent,
			preferLiveMeasure = false,
		}: MaybeMeasureAndStoreParams = {}) => {
			"worklet";
			if (!enabled) return;

			const intents = getMeasurementIntentFlags(intent);

			const expectedSourceScreenKey: string | undefined =
				resolvePendingSourceKey(sharedBoundTag, preferredSourceScreenKey) ||
				undefined;

			if (intents.captureSource && isAnimating.get() && !preferLiveMeasure) {
				const existing = BoundStore.getSnapshot(
					sharedBoundTag,
					currentScreenKey,
				);
				if (existing) {
					applyMeasuredBoundsWrites({
						sharedBoundTag,
						ancestorKeys,
						navigatorKey,
						ancestorNavigatorKeys,
						currentScreenKey,
						measured: existing.bounds,
						preparedStyles,
						shouldSetSource: true,
					});
					return;
				}

				// No cached snapshot while animating.
				// Fall through to a live measurement so rapid retargeting still
				// captures a valid source link.
			}

			const hasPendingLink = expectedSourceScreenKey
				? BoundStore.hasPendingLinkFromSource(
						sharedBoundTag,
						expectedSourceScreenKey,
					)
				: BoundStore.hasPendingLink(sharedBoundTag);
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
			const shouldWriteSnapshot =
				hasSnapshotChanged &&
				(writePlan.registerSnapshot ||
					writePlan.captureSource ||
					writePlan.completeDestination ||
					writePlan.refreshSource ||
					writePlan.refreshDestination);

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
