import { DefaultSnapSpec } from "../../configs/specs";
import type { TransitionSpec } from "../../types/animation.types";

export type SnapTransitionDirection = "expand" | "collapse";

export const resolveSnapTransitionSpec = (
	spec: TransitionSpec | undefined,
	direction: SnapTransitionDirection,
): TransitionSpec => {
	"worklet";
	const config =
		direction === "collapse"
			? (spec?.collapse ?? DefaultSnapSpec)
			: (spec?.expand ?? DefaultSnapSpec);

	// Numeric snap targets are not lifecycle closes. Keep both slots pointed at the
	// selected snap config so animateToProgress can pick a config without toggling
	// the route-level closing flag for non-dismiss snap changes.
	return {
		open: config,
		close: config,
	};
};
