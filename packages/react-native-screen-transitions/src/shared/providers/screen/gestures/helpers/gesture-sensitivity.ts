import type { SharedValue } from "react-native-reanimated";
import { DEFAULT_GESTURE_SENSITIVITY } from "../../../../constants";
import type { GestureRuntimeOverrides } from "../types";

type GestureSensitivityInput = number | SharedValue<number>;

const readGestureSensitivityInput = (
	gestureSensitivity: GestureSensitivityInput,
): number => {
	"worklet";

	return typeof gestureSensitivity === "number"
		? gestureSensitivity
		: gestureSensitivity.get();
};

export const resolveGestureSensitivity = (
	gestureSensitivity: GestureSensitivityInput,
	runtimeOverrides: GestureRuntimeOverrides,
): number => {
	"worklet";

	const runtimeSensitivity = runtimeOverrides.gestureSensitivity.get();
	const resolvedSensitivity =
		runtimeSensitivity ?? readGestureSensitivityInput(gestureSensitivity);

	return Number.isFinite(resolvedSensitivity)
		? resolvedSensitivity
		: DEFAULT_GESTURE_SENSITIVITY;
};
