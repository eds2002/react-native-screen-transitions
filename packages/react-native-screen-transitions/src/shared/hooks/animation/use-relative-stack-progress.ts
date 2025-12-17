import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import { useStackRootContext } from "../../providers/stack-root.provider";

/**
 * Hook that computes relative stack progress for a screen/overlay at a given index.
 *
 * The relative progress is: `totalStackProgress - myIndex`
 *
 * For example, with 4 screens (indices 0,1,2,3) fully visible (stackProgress = 4):
 * - Screen at index 1: 4 - 1 = 3 (itself + 2 screens above)
 * - When screen 3 closes (progress 1→0): stackProgress → 3
 * - Screen at index 1 now sees: 3 - 1 = 2
 *
 * @param myIndex - The index of the current screen/overlay in the stack
 * @returns DerivedValue of the relative stack progress
 */
export function useRelativeStackProgress(
	myIndex: number,
): DerivedValue<number> {
	const { stackProgress } = useStackRootContext();

	return useDerivedValue(() => {
		"worklet";
		return stackProgress.value - myIndex;
	}, [myIndex]);
}
