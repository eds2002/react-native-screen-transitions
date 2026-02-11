import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import { useSharedValueState } from "../reanimated/use-shared-value-state";

/**
 * Returns a JS-focused index derived from optimisticFocusedIndex and clamped to route count.
 * Keeps callers aligned on focus behavior during transitions with closing screens.
 */
export function useOptimisticFocusedIndex(
	optimisticFocusedIndex: DerivedValue<number>,
	routeCount: number,
): number {
	return useSharedValueState(
		useDerivedValue(() => {
			const globalIndex = optimisticFocusedIndex.get();
			if (routeCount <= 0) return 0;
			return Math.max(0, Math.min(globalIndex, routeCount - 1));
		}),
	);
}
