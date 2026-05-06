import { DEFAULT_GESTURE_SENSITIVITY } from "../../../../constants";
import type { GestureRuntimeOverrides } from "../types";

export const resolveGestureSensitivity = (
	gestureSensitivity: number,
	runtimeOverrides: GestureRuntimeOverrides,
): number => {
	"worklet";

	const runtimeSensitivity = runtimeOverrides.gestureSensitivity.get();
	const resolvedSensitivity = runtimeSensitivity ?? gestureSensitivity;

	return Number.isFinite(resolvedSensitivity)
		? resolvedSensitivity
		: DEFAULT_GESTURE_SENSITIVITY;
};
