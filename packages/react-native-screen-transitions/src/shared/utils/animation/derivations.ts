import type { ScreenTransitionState } from "../../types/animation.types";

interface DerivationsParams {
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	/**
	 * Accumulated progress from the current screen's position onwards.
	 * Only available in blank-stack. Undefined in native-stack.
	 */
	stackProgress?: number;
}

/**
 * Additional values to help make defining animations easier.
 */
export const derivations = ({
	current,
	next,
	stackProgress,
}: DerivationsParams) => {
	"worklet";

	// The combined progress (current + next, 0-2 range)
	const progress = current.progress + (next?.progress ?? 0);

	// Whether the current screen is focused
	const focused = !next;

	const active = focused ? current : (next ?? current);
	const isActiveTransitioning = !!(
		active.gesture.isDragging || active.animating
	);

	const isDismissing = !!(active.gesture.isDismissing || active.closing);

	return {
		progress,
		focused,
		active,
		isActiveTransitioning,
		isDismissing,
		// Stack progress: accumulated from current position onwards (0-N range)
		// Falls back to regular progress when not in blank-stack
		stackProgress: stackProgress ?? progress,
	};
};
