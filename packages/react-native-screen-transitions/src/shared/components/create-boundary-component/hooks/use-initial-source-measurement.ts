import { useAnimatedReaction } from "react-native-reanimated";
import { getGroupActiveId } from "../../../stores/bounds/internals/groups";
import { getPendingLink } from "../../../stores/bounds/internals/links";
import { groups } from "../../../stores/bounds/internals/state";
import type { BoundaryId, MeasureParams } from "../types";

export const useInitialSourceMeasurement = (params: {
	enabled: boolean;
	nextScreenKey?: string;
	currentScreenKey?: string;
	measureBoundary: (options: MeasureParams) => void;
	sharedBoundTag: string;
	id: BoundaryId;
	group?: string;
	shouldAutoMeasure: boolean;
}) => {
	const {
		enabled,
		nextScreenKey,
		measureBoundary,
		sharedBoundTag,
		id,
		currentScreenKey,
		group,
		shouldAutoMeasure,
	} = params;

	// NOTE:
	// Keep group-active retargeting here instead of `useRefreshBoundary`.
	// `useRefreshBoundary` waits for animation refresh signals, while group
	// activeId can change independently when the destination retargets.
	// Capturing here lets source bounds update as soon as the active member changes.
	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled || !group || !nextScreenKey) return null;

			// Read the mutable group store directly; the helper accessor does not
			// register as a reactive dependency for `useAnimatedReaction`.
			return groups.get()[group]?.activeId ?? null;
		},
		(curr, prev) => {
			"worklet";
			if (prev != null && curr !== prev && curr === String(id)) {
				measureBoundary({ intent: "capture-source" });
			}
		},
	);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled || !nextScreenKey) {
				return 0;
			}

			if (shouldAutoMeasure) {
				return 1;
			}

			if (group && getGroupActiveId(group) !== String(id)) {
				return 0;
			}

			return getPendingLink(sharedBoundTag, currentScreenKey) ? 1 : 0;
		},
		(captureSignal) => {
			"worklet";
			if (!enabled || !captureSignal) return;

			console.log("measuring");
			measureBoundary({ intent: "capture-source" });
		},
	);
};
