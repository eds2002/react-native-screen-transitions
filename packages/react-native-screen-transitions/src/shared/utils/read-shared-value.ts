import {
	executeOnUIRuntimeSync,
	type SharedValue,
} from "react-native-reanimated";

/**
 * Safely read a SharedValue from the UI thread.
 * Avoids the "cannot read .value inside component render" warning.
 */
export const readSharedValue = executeOnUIRuntimeSync(
	<T>(sv: SharedValue<T>): T => {
		"worklet";
		return sv.value;
	},
);
