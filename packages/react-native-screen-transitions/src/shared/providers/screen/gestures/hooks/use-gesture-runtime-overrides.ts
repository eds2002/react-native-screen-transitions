import { useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { GestureRuntimeOverrides } from "../types";

export const useGestureRuntimeOverrides = (): GestureRuntimeOverrides => {
	const gestureSensitivity = useSharedValue<number | null>(null);

	return useMemo(() => ({ gestureSensitivity }), [gestureSensitivity]);
};
