import type { TransitionInterpolatedStyle } from "../../../../types/animation.types";
import type { GestureContextType } from "../../gestures";

const getRuntimeGestureSensitivity = (
	config: TransitionInterpolatedStyle["config"] | undefined,
) => {
	"worklet";

	if (
		typeof config !== "object" ||
		config === null ||
		"style" in config ||
		"props" in config
	) {
		return undefined;
	}

	if (!("gestureSensitivity" in config)) {
		return undefined;
	}

	return config.gestureSensitivity;
};

/**
 * Forwards the reserved `config` block returned by `screenStyleInterpolator`
 * into the gesture runtime override bag created by `useGestureRuntimeOverrides`.
 * Interpolator config entries are not style slots; they map onto shared values
 * that the gesture runtime reads per frame to override static policy.
 */
export const syncGestureRuntimeOverrides = (
	raw: TransitionInterpolatedStyle | undefined,
	gestureContext: GestureContextType | null,
) => {
	"worklet";
	const runtimeOverrides = gestureContext?.runtimeOverrides;

	if (!runtimeOverrides) return;

	const gestureSensitivity = getRuntimeGestureSensitivity(raw?.config);

	runtimeOverrides.gestureSensitivity.set(
		typeof gestureSensitivity === "number" ? gestureSensitivity : null,
	);
};
