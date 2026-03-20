import type { View } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
	type SharedValue,
	type StyleProps,
} from "react-native-reanimated";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import { BoundStore } from "../../../stores/bounds";
import { applyMeasuredBoundsWrites } from "../../../stores/bounds/helpers/apply-measured-bounds-writes";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MaybeMeasureAndStoreParams, MeasurementIntent } from "../types";

type LayoutAnchor = {
	correctMeasurement: (measured: MeasuredDimensions) => MeasuredDimensions;
	isMeasurementInViewport?: (measured: MeasuredDimensions) => boolean;
} | null;

type MeasurementIntentFlags = {
	captureSource: boolean;
	completeDestination: boolean;
	refreshSource: boolean;
	refreshDestination: boolean;
	snapshotOnly: boolean;
};

type MeasurementWritePlan = {
	captureSource: boolean;
	completeDestination: boolean;
	refreshSource: boolean;
	refreshDestination: boolean;
	registerSnapshot: boolean;
	writesAny: boolean;
	wantsDestinationWrite: boolean;
};

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

const getMeasurementIntentFlags = (
	intent?: MeasurementIntent | readonly MeasurementIntent[],
): MeasurementIntentFlags => {
	"worklet";
	const flags: MeasurementIntentFlags = {
		captureSource: false,
		completeDestination: false,
		refreshSource: false,
		refreshDestination: false,
		snapshotOnly: false,
	};

	if (!intent) {
		return flags;
	}

	const intents = Array.isArray(intent) ? intent : [intent];

	for (let i = 0; i < intents.length; i++) {
		switch (intents[i]) {
			case "capture-source":
				flags.captureSource = true;
				break;
			case "complete-destination":
				flags.completeDestination = true;
				break;
			case "refresh-source":
				flags.refreshSource = true;
				break;
			case "refresh-destination":
				flags.refreshDestination = true;
				break;
			case "snapshot-only":
				flags.snapshotOnly = true;
				break;
		}
	}

	return flags;
};

const resolveMeasurementWritePlan = (params: {
	intents: MeasurementIntentFlags;
	hasPendingLink: boolean;
	hasSourceLink: boolean;
	hasDestinationLink: boolean;
}): MeasurementWritePlan => {
	"worklet";
	const { intents, hasPendingLink, hasSourceLink, hasDestinationLink } = params;

	const captureSource = intents.captureSource;
	const completeDestination = intents.completeDestination && hasPendingLink;
	const refreshSource = intents.refreshSource && hasSourceLink;
	const refreshDestination =
		intents.refreshDestination && (hasDestinationLink || hasPendingLink);
	const registerSnapshot = intents.snapshotOnly;
	const writesAny =
		registerSnapshot ||
		captureSource ||
		completeDestination ||
		refreshSource ||
		refreshDestination;

	return {
		captureSource,
		completeDestination,
		refreshSource,
		refreshDestination,
		registerSnapshot,
		writesAny,
		wantsDestinationWrite: completeDestination || refreshDestination,
	};
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
		({ intent }: MaybeMeasureAndStoreParams = {}) => {
			"worklet";
			if (!enabled) return;

			const intents = getMeasurementIntentFlags(intent);

			const expectedSourceScreenKey: string | undefined =
				resolvePendingSourceKey(sharedBoundTag, preferredSourceScreenKey) ||
				undefined;

			if (intents.captureSource && isAnimating.get()) {
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

			const measured = measure(animatedRef);
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
