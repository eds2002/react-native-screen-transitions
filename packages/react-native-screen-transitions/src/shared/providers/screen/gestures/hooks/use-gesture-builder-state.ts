import { useSharedValue } from "react-native-reanimated";
import type { ScreenGestureParticipation } from "../types";

/**
 * Creates the shared values that both pan and pinch runtimes need while a
 * recognizer is active.
 *
 * `gestureProgressBaseline` is set to the current animation progress when a
 * gesture starts. Lifecycle handlers use it as the stable baseline for cumulative
 * pan/pinch deltas so progress can be recalculated from the gesture event
 * instead of repeatedly accumulating into the current animated value.
 *
 * `lockedSnapPoint` is the current snap point chosen when a snap gesture starts.
 * Snap release primers set it on start: snap-locked gestures use the
 * nearest resolved snap point, while unlocked snap gestures use the resolved max
 * snap point. The value stays stable through the active gesture and is used as a
 * progress bound/release target.
 */
export const useGestureBuilderState = (
	participation: ScreenGestureParticipation,
) => {
	const gestureProgressBaseline = useSharedValue(1);
	const lockedSnapPoint = useSharedValue(
		participation.effectiveSnapPoints.maxSnapPoint,
	);

	return {
		gestureProgressBaseline,
		lockedSnapPoint,
	};
};
