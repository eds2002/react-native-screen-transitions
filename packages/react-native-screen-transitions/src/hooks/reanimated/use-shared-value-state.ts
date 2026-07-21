import { useState } from "react";
import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { readInitialValue } from "./use-shared-value-ref";

/**
 * Derives React state from a Reanimated SharedValue.
 * Updates the state whenever the shared value changes.
 */
export function useSharedValueState<T>(sharedValue: SharedValue<T>): T {
	const [state, setState] = useState<T>(() => readInitialValue(sharedValue));

	useAnimatedReaction(
		() => sharedValue.get(),
		(value, previousValue) => {
			if (Object.is(value, previousValue)) return;
			scheduleOnRN(setState, value);
		},
	);

	return state;
}
