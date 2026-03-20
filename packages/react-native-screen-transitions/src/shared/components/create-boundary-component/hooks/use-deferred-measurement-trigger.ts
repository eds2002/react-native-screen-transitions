import { useCallback } from "react";
import {
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";

export const useDeferredMeasurementTrigger = (params: {
	enabled: boolean;
	isAnimating: SharedValue<number>;
	canFlush?: () => boolean;
	onFlush: () => void;
}) => {
	const { enabled, isAnimating, canFlush, onFlush } = params;
	const hasPendingMeasurement = useSharedValue(false);

	const clearPendingMeasurement = useCallback(() => {
		"worklet";
		hasPendingMeasurement.value = false;
	}, [hasPendingMeasurement]);

	const queueOrFlushMeasurement = useCallback(() => {
		"worklet";
		if (!enabled) return;

		if (isAnimating.value) {
			hasPendingMeasurement.value = true;
			return;
		}

		hasPendingMeasurement.value = false;
		onFlush();
	}, [enabled, isAnimating, hasPendingMeasurement, onFlush]);

	useAnimatedReaction(
		() => {
			"worklet";
			if (!enabled) return false;
			if (!hasPendingMeasurement.value) return false;
			if (isAnimating.value) return false;
			return canFlush ? canFlush() : true;
		},
		(shouldFlush, previousShouldFlush) => {
			"worklet";
			if (!enabled) return;
			if (!shouldFlush || shouldFlush === previousShouldFlush) return;

			hasPendingMeasurement.value = false;
			onFlush();
		},
		[enabled, isAnimating, hasPendingMeasurement, canFlush, onFlush],
	);

	return {
		clearPendingMeasurement,
		queueOrFlushMeasurement,
	};
};
