import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type { AnimationStoreMap } from "../../../stores/animation.store";

export interface StackDerived {
	/**
	 * @deprecated Use the stack context `focusedIndex` value instead.
	 */
	optimisticFocusedIndex: DerivedValue<number>;
}

/**
 * Derives stack values shared by managed stack internals.
 * The optimistic focused index remains as a compatibility alias for focusedIndex.
 */
export function useStackDerived(
	_animationMaps: AnimationStoreMap[],
	focusedIndex: number,
): StackDerived {
	const optimisticFocusedIndex = useDerivedValue(() => {
		"worklet";
		return focusedIndex;
	});

	return { optimisticFocusedIndex };
}
