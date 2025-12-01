import type { ScreenTransitionState } from "../../types/animation";

interface DerivationsParams {
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
}

/**
 * Additional values to help make defining animations easier.
 */
export const derivations = ({ current, next }: DerivationsParams) => {
	"worklet";

	// The combined progress
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
	};
};
