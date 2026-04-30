import type { TransitionInterpolatedStyle } from "../../../../types/animation.types";
import type { GestureContextType } from "../../gestures";

/**
 * Forwards the reserved `options` block returned by `screenStyleInterpolator`
 * into the gesture runtime override bag created by `useGestureRuntimeOverrides`.
 * Interpolator option entries are not style slots; they map onto shared values
 * that the gesture runtime reads per frame to override static policy.
 */
export const syncGestureRuntimeOverrides = (
	raw: TransitionInterpolatedStyle | undefined,
	gestureContext: GestureContextType | null,
) => {
	"worklet";
	const runtimeOverrides = gestureContext?.runtimeOverrides;

	if (!runtimeOverrides) return;

	const gestureSensitivity = raw?.options?.gestures?.gestureSensitivity;

	runtimeOverrides.gestureSensitivity.set(
		typeof gestureSensitivity === "number" ? gestureSensitivity : null,
	);
};
