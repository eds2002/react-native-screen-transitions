import { useCallback, useRef } from "react";
import {
	executeOnUIRuntimeSync,
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
} from "react-native-reanimated";
import { IS_WEB } from "../../constants";

function readInitialValue<T>(sharedValue: SharedValue<T>): T {
	if (IS_WEB) {
		return sharedValue.value;
	}
	const readOnUI = executeOnUIRuntimeSync((sv: SharedValue<T>) => {
		"worklet";
		return sv.value;
	});
	return readOnUI(sharedValue);
}

/**
 * Mirrors a Reanimated SharedValue into a React ref.
 * Same bridging as useSharedValueState but without triggering rerenders.
 */
export function useSharedValueRef<T>(
	sharedValue: SharedValue<T>,
): React.RefObject<T> {
	const ref = useRef<T>(readInitialValue(sharedValue));

	const updateRef = useCallback((value: T) => {
		ref.current = value;
	}, []);

	useAnimatedReaction(
		() => sharedValue.value,
		(value, previousValue) => {
			if (Object.is(value, previousValue)) return;
			runOnJS(updateRef)(value);
		},
	);

	return ref;
}
