import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type { AnimationStoreMap } from "../../../stores/animation.store";

export interface StackDerived {
	/** Sum of all individual screen progress values. */
	stackProgress: DerivedValue<number>;
	/**
	 * Focused index that accounts for closing screens.
	 * Counts consecutive closing screens from the top so that
	 * rapid dismiss chains correctly identify the actual focused screen.
	 */
	optimisticFocusedIndex: DerivedValue<number>;
}

/**
 * Derives aggregated stack progress and an optimistic focused index
 * from animation store maps. Shared between managed and direct providers.
 */
export function useStackDerived(
	animationMaps: AnimationStoreMap[],
): StackDerived {
	const stackProgress = useDerivedValue(() => {
		"worklet";
		let total = 0;
		for (let i = 0; i < animationMaps.length; i++) {
			total += animationMaps[i].progress.value;
		}
		return total;
	});

	const optimisticFocusedIndex = useDerivedValue(() => {
		"worklet";
		const lastIndex = animationMaps.length - 1;
		let closingFromTop = 0;
		for (let i = lastIndex; i >= 0; i--) {
			if (animationMaps[i].closing.value > 0) closingFromTop++;
			else break;
		}
		return lastIndex - closingFromTop;
	});

	return { stackProgress, optimisticFocusedIndex };
}
