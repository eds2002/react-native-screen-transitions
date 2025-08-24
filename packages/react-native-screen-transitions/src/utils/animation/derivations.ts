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
	const progress = current.progress + (next?.progress ?? 0);
	const focused = !next;
	const activeBoundId = Bounds.getActiveBoundId() || "";
	const bounds = createBounds({
		activeBoundId,
		current,
		previous,
		next,
		progress,
		dimensions,
	});

	return { progress, focused, activeBoundId, bounds };
};
