import type { ScreenTransitionState } from "../../types/animation.types";

interface DerivationsParams {
	previous?: ScreenTransitionState;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
}

/**
 * Additional values to help make defining animations easier.
 */
export const derivations = ({ previous, current, next }: DerivationsParams) => {
	"worklet";

	// The combined progress (current + next, 0-2 range)
	const progress = current.progress + (next?.progress ?? 0);

	// Whether the current screen is focused
	const focused = !next;

	// The screen driving the transition
	const active = focused ? current : (next ?? current);

	// The screen NOT driving the transition
	const inactive = focused ? previous : current;

	const isActiveTransitioning = !!(
		active.gesture.isDragging || active.animating
	);

	const isDismissing = !!(active.gesture.isDismissing || active.closing);

	return {
		progress,
		focused,
		active,
		inactive,
		isActiveTransitioning,
		isDismissing,
	};
};
