import type { SharedValue } from "react-native-reanimated";

/**
 * Emits a one-frame pulse on any shared value, then restores the provided
 * resting value on the next frame.
 */
export const emit = <T>(
	sharedValue: SharedValue<T>,
	activeValue: T,
	restValue: T,
) => {
	"worklet";
	sharedValue.set(activeValue);
	requestAnimationFrame(() => {
		"worklet";
		sharedValue.set(restValue);
	});
};
