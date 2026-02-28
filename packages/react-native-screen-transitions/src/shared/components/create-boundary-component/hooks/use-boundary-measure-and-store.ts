import type { View } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import type { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { applyMeasuredBoundsWrites } from "../../../stores/bounds/helpers/apply-measured-bounds-writes";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MaybeMeasureAndStoreParams } from "../types";

type LayoutAnchor = {
	correctMeasurement: (measured: MeasuredDimensions) => MeasuredDimensions;
	isMeasurementInViewport?: (measured: MeasuredDimensions) => boolean;
} | null;

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
	isAnimating: ReturnType<typeof AnimationStore.getRouteAnimation>;
	preparedStyles: StyleProps;
	animatedRef: AnimatedRef<View>;
	layoutAnchor: LayoutAnchor;
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
		animatedRef,
		layoutAnchor,
	} = params;

	return useStableCallbackValue(
		({
			shouldSetSource,
			shouldSetDestination,
			shouldUpdateSource,
			shouldUpdateDestination,
		}: MaybeMeasureAndStoreParams = {}) => {
			"worklet";
			if (!enabled) return;

			const expectedSourceScreenKey: string | undefined =
				resolvePendingSourceKey(sharedBoundTag, preferredSourceScreenKey) ||
				undefined;

			if (shouldSetSource && isAnimating.get()) {
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

			const canSetSource = !!shouldSetSource;
			const canSetDestination = !!shouldSetDestination && hasPendingLink;
			const canUpdateSource = !!shouldUpdateSource && hasSourceLink;
			const canUpdateDestination =
				!!shouldUpdateDestination && (hasDestinationLink || hasPendingLink);

			if (
				!canSetSource &&
				!canSetDestination &&
				!canUpdateSource &&
				!canUpdateDestination
			) {
				return;
			}

			const measured = measure(animatedRef);
			if (!measured) return;

			const correctedMeasured = layoutAnchor
				? layoutAnchor.correctMeasurement(measured)
				: measured;

			const wantsDestinationWrite = canSetDestination || canUpdateDestination;
			const destinationInViewport =
				!wantsDestinationWrite ||
				!layoutAnchor ||
				!layoutAnchor.isMeasurementInViewport ||
				layoutAnchor.isMeasurementInViewport(correctedMeasured);

			if (!destinationInViewport && !canSetSource && !canUpdateSource) {
				return;
			}

			const existingSnapshot = BoundStore.getSnapshot(
				sharedBoundTag,
				currentScreenKey,
			);
			const hasSnapshotChanged =
				!existingSnapshot ||
				!areMeasurementsEqual(existingSnapshot.bounds, correctedMeasured);

			applyMeasuredBoundsWrites({
				sharedBoundTag,
				currentScreenKey,
				measured: correctedMeasured,
				preparedStyles,
				ancestorKeys,
				navigatorKey,
				ancestorNavigatorKeys,
				expectedSourceScreenKey,
				shouldRegisterSnapshot: hasSnapshotChanged,
				shouldSetSource: canSetSource,
				shouldUpdateSource: canUpdateSource && hasSnapshotChanged,
				shouldUpdateDestination:
					canUpdateDestination && destinationInViewport && hasSnapshotChanged,
				shouldSetDestination: canSetDestination && destinationInViewport,
			});
		},
	);
};
