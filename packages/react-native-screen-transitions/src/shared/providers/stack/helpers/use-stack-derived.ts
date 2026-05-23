import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type { AnimationStoreMap } from "../../../stores/animation.store";

type StackDerivedAnimationMap = Pick<AnimationStoreMap, "closing">;

export interface StackDerived {
	/**
	 * Focused index that accounts for closing screens.
	 * Counts consecutive closing screens from the top so that
	 * rapid dismiss chains correctly identify the actual focused screen.
	 */
	optimisticFocusedIndex: DerivedValue<number>;
}

/**
 * Derives an optimistic focused index from animation store maps.
 * Shared between managed and direct providers.
 */
export function useStackDerived(
	animationMaps: StackDerivedAnimationMap[],
): StackDerived {
	const optimisticFocusedIndex = useDerivedValue(() => {
		"worklet";
		const lastIndex = animationMaps.length - 1;
		let closingFromTop = 0;
		for (let i = lastIndex; i >= 0; i--) {
			if (animationMaps[i].closing.get() > 0) closingFromTop++;
			else break;
		}
		return lastIndex - closingFromTop;
	});

	return { optimisticFocusedIndex };
}
