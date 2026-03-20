import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import {
	canFlushGroupActiveMeasurement,
	resolveGroupActiveMeasurementAction,
} from "./helpers/measurement-rules";
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
				return canFlushGroupActiveMeasurement({
					enabled,
					isEligible: !!group && hasNextScreen,
					memberId: idStr,
					activeId: group ? (allGroups.value[group]?.activeId ?? null) : null,
				});
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
			const action = resolveGroupActiveMeasurementAction({
				enabled,
				isEligible: !!group && hasNextScreen,
				memberId: idStr,
				activeId,
				previousActiveId,
			});

			if (action === "clear-pending") {
				clearPendingMeasurement();
				return;
			}

			if (action === "queue-or-flush") {
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
