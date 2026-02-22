import type { View } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
	type StyleProps,
} from "react-native-reanimated";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import type { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds.store";
import type { BoundaryMode, MaybeMeasureAndStoreParams } from "../types";

type LayoutAnchor = {
	correctMeasurement: (measured: MeasuredDimensions) => MeasuredDimensions;
	isMeasurementInViewport?: (measured: MeasuredDimensions) => boolean;
} | null;

export const useBoundaryMeasureAndStore = (params: {
	enabled: boolean;
	mode?: BoundaryMode;
	sharedBoundTag: string;
	preferredSourceScreenKey?: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	isAnimating: ReturnType<typeof AnimationStore.getAnimation>;
	preparedStyles: StyleProps;
	animatedRef: AnimatedRef<View>;
	layoutAnchor: LayoutAnchor;
}) => {
	const {
		enabled,
		mode,
		sharedBoundTag,
		preferredSourceScreenKey,
		currentScreenKey,
		ancestorKeys,
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
			const canParticipateAsSource = mode !== "destination";
			const canParticipateAsDestination = mode !== "source";

			const fallbackSourceScreenKey =
				BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag);
			const expectedSourceScreenKey: string | undefined =
				preferredSourceScreenKey &&
				BoundStore.hasPendingLinkFromSource(
					sharedBoundTag,
					preferredSourceScreenKey,
				)
					? preferredSourceScreenKey
					: fallbackSourceScreenKey || undefined;

			if (shouldSetSource && canParticipateAsSource && isAnimating.get()) {
				const existing = BoundStore.getSnapshot(
					sharedBoundTag,
					currentScreenKey,
				);
				if (existing) {
					BoundStore.setLinkSource(
						sharedBoundTag,
						currentScreenKey,
						existing.bounds,
						preparedStyles,
						ancestorKeys,
					);
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

			const canSetSource = canParticipateAsSource && !!shouldSetSource;
			const canSetDestination =
				canParticipateAsDestination && !!shouldSetDestination && hasPendingLink;
			const canUpdateSource =
				canParticipateAsSource && !!shouldUpdateSource && hasSourceLink;
			const canUpdateDestination =
				canParticipateAsDestination &&
				!!shouldUpdateDestination &&
				(hasDestinationLink || hasPendingLink);

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

			BoundStore.registerSnapshot(
				sharedBoundTag,
				currentScreenKey,
				correctedMeasured,
				preparedStyles,
				ancestorKeys,
			);

			if (canSetSource) {
				BoundStore.setLinkSource(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);
			}

			if (canUpdateSource) {
				BoundStore.updateLinkSource(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
				);
			}

			if (canUpdateDestination && destinationInViewport) {
				BoundStore.updateLinkDestination(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
					expectedSourceScreenKey,
				);
			}

			if (canSetDestination && destinationInViewport) {
				BoundStore.setLinkDestination(
					sharedBoundTag,
					currentScreenKey,
					correctedMeasured,
					preparedStyles,
					ancestorKeys,
					expectedSourceScreenKey,
				);
			}
		},
	);
};
