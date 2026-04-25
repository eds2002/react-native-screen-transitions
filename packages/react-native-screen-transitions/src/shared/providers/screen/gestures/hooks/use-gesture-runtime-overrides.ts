import { useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { GestureRuntimeOverrides } from "../types";

/**
 * Holds gesture options that can be driven by `screenStyleInterpolator`.
 * Currently this only supports `config.gestureSensitivity`, which overrides
 * the static screen prop while it is provided by the interpolator.
 */
export const useGestureRuntimeOverrides = (): GestureRuntimeOverrides => {
	const gestureSensitivity = useSharedValue<number | null>(null);

	return useMemo(() => ({ gestureSensitivity }), [gestureSensitivity]);
};
