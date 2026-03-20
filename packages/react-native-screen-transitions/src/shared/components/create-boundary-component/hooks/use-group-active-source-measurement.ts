import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import { useDeferredMeasurementTrigger } from "./use-deferred-measurement-trigger";

export const useGroupActiveSourceMeasurement = (params: {
	enabled: boolean;
	group: string | undefined;
	id: BoundaryId;
	hasNextScreen: boolean;
	isAnimating: SharedValue<number>;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		group,
		id,
		hasNextScreen,
		isAnimating,
		maybeMeasureAndStore,
	} = params;
	const idStr = String(id);
	const allGroups = BoundStore.getGroups();
	const { clearPendingMeasurement, queueOrFlushMeasurement } =
		useDeferredMeasurementTrigger({
			enabled,
			isAnimating,
			canFlush: () => {
				"worklet";
				if (!group || !hasNextScreen) return false;
				return allGroups.value[group]?.activeId === idStr;
			},
			onFlush: () => {
				"worklet";
				maybeMeasureAndStore({ intent: "refresh-source" });
			},
		});

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return null;
			if (!group) return null;
			return allGroups.value[group]?.activeId ?? null;
		},
		(activeId, previousActiveId) => {
			"worklet";
			if (!enabled) return;
			if (!group || !hasNextScreen) return;

			if (activeId !== idStr) {
				clearPendingMeasurement();
				return;
			}

			if (activeId === idStr && activeId !== previousActiveId) {
				queueOrFlushMeasurement();
			}
		},
		[
			enabled,
			group,
			idStr,
			hasNextScreen,
			clearPendingMeasurement,
			queueOrFlushMeasurement,
		],
	);
};
