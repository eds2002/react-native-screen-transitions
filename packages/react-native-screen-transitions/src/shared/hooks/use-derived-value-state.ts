import { useState } from "react";
import {
	executeOnUIRuntimeSync,
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
	useDerivedValue,
} from "react-native-reanimated";

/**
 * Derives React state from a Reanimated worklet.
 *
 * @param processor - The worklet function that calculates the value
 * @param dependencies - Array of dependencies for the worklet
 * @returns The derived value as React State
 */
export function useDerivedValueState<T>(
	processor: () => T,
	dependencies: any[] = [],
): T {
	const derivedValue = useDerivedValue(processor, dependencies);

	const [state, setState] = useState<T>(() => {
		const readOnUI = executeOnUIRuntimeSync((sv: SharedValue<T>) => {
			"worklet";
			return sv.value;
		});
		return readOnUI(derivedValue);
	});

	useAnimatedReaction(
		() => derivedValue.value,
		(curr, prev) => {
			if (curr !== prev) {
				runOnJS(setState)(curr);
			}
		},
	);

	return state;
}
