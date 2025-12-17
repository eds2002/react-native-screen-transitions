import { useWindowDimensions } from "react-native";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStackRootContext } from "../../providers/stack-root.provider";
import type { OverlayInterpolationProps } from "../../types/animation.types";
import { useSharedValueState } from "../reanimated/use-shared-value-state";

/**
 * Hook that provides overlay animation state from the root context.
 * Replaces the stack-specific useOverlayAnimation hooks.
 *
 * @param overlayIndex - The index of the overlay in the stack (0-based)
 * @returns Overlay animation values and optimistic active index
 */
export function useOverlayState(overlayIndex: number): {
	overlayAnimation: DerivedValue<OverlayInterpolationProps>;
	optimisticActiveIndex: number;
} {
	const { stackProgress, optimisticFocusedIndex, routeKeys } =
		useStackRootContext();
	const screen = useWindowDimensions();
	const insets = useSafeAreaInsets();

	// Relative progress: how many screens above (and including) this overlay
	const relativeProgress = useDerivedValue(() => {
		"worklet";
		return stackProgress.value - overlayIndex;
	}, [overlayIndex]);

	// Optimistic active index relative to this overlay
	// This tells us which screen above the overlay is "active"
	const optimisticActiveIndex = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			// Number of screens above the overlay
			const screensAbove = routeKeys.length - 1 - overlayIndex;
			// Optimistic focused index relative to overlay position
			const relativeOptimistic = optimisticFocusedIndex.value - overlayIndex;
			// Clamp to valid range
			return Math.max(0, Math.min(relativeOptimistic, screensAbove));
		}, [overlayIndex, routeKeys.length]),
	);

	// Overlay animation props (compatible with existing overlay interpolators)
	const overlayAnimation = useDerivedValue<OverlayInterpolationProps>(() => ({
		progress: relativeProgress.value,
		layouts: { screen },
		insets,
	}));

	return {
		overlayAnimation,
		optimisticActiveIndex,
	};
}
