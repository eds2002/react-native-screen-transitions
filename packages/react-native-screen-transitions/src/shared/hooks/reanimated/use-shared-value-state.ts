import { useState } from "react";
import {
	executeOnUIRuntimeSync,
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
} from "react-native-reanimated";
import { IS_WEB } from "../../constants";

/**
 * Derives React state from a Reanimated SharedValue.
 * Updates the state whenever the shared value changes.
 */
export function useSharedValueState<T>(sharedValue: SharedValue<T>): T {
	const [state, setState] = useState<T>(() => {
		if (IS_WEB) {
			// Web fallback - executeOnUIRuntimeSync not available
			return sharedValue.value;
		}
		const readOnUI = executeOnUIRuntimeSync((sv: SharedValue<T>) => {
			"worklet";
			return sv.value;
		});
		return readOnUI(sharedValue);
	});

	useAnimatedReaction(
		() => sharedValue.value,
		(value, previousValue) => {
			if (Object.is(value, previousValue)) return;
			runOnJS(setState)(value);
		},
	);

	return state;
}
