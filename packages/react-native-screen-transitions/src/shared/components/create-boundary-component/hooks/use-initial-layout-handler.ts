import { useCallback, useLayoutEffect } from "react";
import { runOnUI, useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { BoundaryId, MaybeMeasureAndStoreParams } from "../types";
import { resolveInitialLayoutMeasurementIntent } from "./helpers/measurement-rules";

export const useInitialLayoutHandler = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	id: BoundaryId;
	group?: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	expectedSourceScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		sharedBoundTag,
		id,
		group,
		currentScreenKey,
		ancestorKeys,
		expectedSourceScreenKey,
		maybeMeasureAndStore,
	} = params;

	const isAnimating = AnimationStore.getValue(currentScreenKey, "animating");

	const ancestorAnimations = ancestorKeys.map((key) =>
		AnimationStore.getValue(key, "animating"),
	);

	const hasMeasuredOnLayout = useSharedValue(false);

	const handleInitialLayout = useCallback(() => {
		"worklet";
		if (!enabled) return;
		if (!sharedBoundTag || hasMeasuredOnLayout.get()) return;
		const currentGroupActiveId = group
			? BoundStore.getGroupActiveId(group)
			: null;
		if (group && currentGroupActiveId !== String(id)) return;

		let isAnyAnimating = isAnimating.get();
		for (let i = 0; i < ancestorAnimations.length; i++) {
			if (ancestorAnimations[i].get()) {
				isAnyAnimating = 1;
				break;
			}
		}

		let hasPendingLinkFromSource = false;

		if (isAnyAnimating) {
			const resolvedSourceKey = resolvePendingSourceKey(
				sharedBoundTag,
				expectedSourceScreenKey,
			);
			if (
				resolvedSourceKey &&
				BoundStore.hasPendingLinkFromSource(sharedBoundTag, resolvedSourceKey)
			) {
				hasPendingLinkFromSource = true;
			}
		}

		const intent = resolveInitialLayoutMeasurementIntent({
			enabled,
			hasSharedBoundTag: !!sharedBoundTag,
			hasMeasuredOnLayout: hasMeasuredOnLayout.get(),
			isAnyAnimating: !!isAnyAnimating,
			hasPendingLinkFromSource,
		});
		if (!intent) return;

		maybeMeasureAndStore({
			intent,
		});

		hasMeasuredOnLayout.set(true);
	}, [
		enabled,
		sharedBoundTag,
		id,
		group,
		hasMeasuredOnLayout,
		isAnimating,
		ancestorAnimations,
		maybeMeasureAndStore,
		expectedSourceScreenKey,
	]);

	// Try to capture destination bounds during layout phase as soon as the
	// boundary mounts; guards in handleInitialLayout keep this idempotent.
	useLayoutEffect(() => {
		if (!enabled) return;
		runOnUI(handleInitialLayout)();
	}, [enabled, handleInitialLayout]);
};
