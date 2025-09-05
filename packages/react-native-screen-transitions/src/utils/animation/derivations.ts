import type { ScaledSize } from "react-native";
import { Bounds } from "../../stores/bounds";
import type { ScreenTransitionState } from "../../types/animation";
import { createBounds } from "../bounds";

interface DerivationsParams {
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	previous?: ScreenTransitionState;
	dimensions: ScaledSize;
}

/**
 * Additional values to help make defining animations easier.
 */
export const derivations = ({
	current,
	next,
	previous,
	dimensions,
}: DerivationsParams) => {
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

	// The active bound id
	const activeBoundId = Bounds.getActiveBound(current, next, previous);

	// bounds api
	const bounds = createBounds({
		activeBoundId,
		current,
		previous,
		next,
		progress,
		dimensions,
	});

	return {
		progress,
		focused,
		activeBoundId,
		bounds,
		active,
		isActiveTransitioning,
		isDismissing,
	};
};
