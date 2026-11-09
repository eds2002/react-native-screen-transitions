import type { SharedValue } from "react-native-reanimated";
import { runOnUISync } from "react-native-worklets";
import { IS_WEB } from "../../constants";

export function readInitialValue<T>(sharedValue: SharedValue<T>): T {
	if (IS_WEB) {
		return sharedValue.get();
	}
	return runOnUISync((sv: SharedValue<T>) => {
		"worklet";
		return sv.get();
	}, sharedValue);
}
