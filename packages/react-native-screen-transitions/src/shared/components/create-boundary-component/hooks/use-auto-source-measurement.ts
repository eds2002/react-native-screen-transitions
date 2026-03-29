import { useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import { resolveAutoSourceCaptureSignal } from "./helpers/measurement-rules";

export const useAutoSourceMeasurement = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	id: BoundaryId;
	group?: string;
	nextScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		sharedBoundTag,
		id,
		group,
		nextScreenKey,
		maybeMeasureAndStore,
	} = params;
	const boundaryPresence = BoundStore.getBoundaryPresence();

	useAnimatedReaction(
		() => {
			"worklet";
			return resolveAutoSourceCaptureSignal({
				enabled,
				nextScreenKey,
				tagPresence: boundaryPresence.value[sharedBoundTag],
			});
		},
		(captureSignal, previousCaptureSignal) => {
			"worklet";
			if (!enabled) return;
			if (!nextScreenKey) return;
			if (!captureSignal || captureSignal === previousCaptureSignal) return;
			const currentGroupActiveId = group
				? BoundStore.getGroupActiveId(group)
				: null;
			if (group && currentGroupActiveId !== String(id)) {
				return;
			}
			maybeMeasureAndStore({ intent: "capture-source" });
		},
		[
			enabled,
			id,
			group,
			nextScreenKey,
			sharedBoundTag,
			boundaryPresence,
			maybeMeasureAndStore,
		],
	);
};
