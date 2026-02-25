import { useCallback, useLayoutEffect } from "react";
import { runOnUI, useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { BoundStore } from "../../../stores/bounds";
import { resolvePendingSourceKey } from "../helpers/resolve-pending-source-key";
import type { MaybeMeasureAndStoreParams } from "../types";

export const useInitialLayoutHandler = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	expectedSourceScreenKey?: string;
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
}) => {
	const {
		enabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		expectedSourceScreenKey,
		maybeMeasureAndStore,
	} = params;

	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);

	const ancestorAnimations = ancestorKeys.map((key) =>
		AnimationStore.getAnimation(key, "animating"),
	);

	const hasMeasuredOnLayout = useSharedValue(false);

	const handleInitialLayout = useCallback(() => {
		"worklet";
		if (!enabled) return;
		if (!sharedBoundTag || hasMeasuredOnLayout.get()) return;

		let isAnyAnimating = isAnimating.get();
		for (let i = 0; i < ancestorAnimations.length; i++) {
			if (ancestorAnimations[i].get()) {
				isAnyAnimating = 1;
				break;
			}
		}

		if (!isAnyAnimating) return;
		const resolvedSourceKey = resolvePendingSourceKey(
			sharedBoundTag,
			expectedSourceScreenKey,
		);
		if (!resolvedSourceKey) return;
		if (
			!BoundStore.hasPendingLinkFromSource(sharedBoundTag, resolvedSourceKey)
		) {
			return;
		}

		maybeMeasureAndStore({
			shouldSetSource: false,
			shouldSetDestination: true,
		});

		hasMeasuredOnLayout.set(true);
	}, [
		enabled,
		sharedBoundTag,
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
