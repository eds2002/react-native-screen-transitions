import { useMemo } from "react";
import { createScreenTransitionState } from "../../../../constants";
import type {
	BuiltState,
	MotionAnimationState,
} from "../../motion/animation/helpers/hydrate-transition-state/types";

// Shared motion inputs can be read by multiple orchestrators. Only the output
// objects are local, so one reader's overrides cannot mutate another's frame.
export function useInterpolatorState(
	motion: MotionAnimationState | null,
): BuiltState | undefined {
	return useMemo(
		() =>
			motion
				? {
						...motion,
						gesture: motion,
						optionsSlot: {},
						contentLayoutSlot: { width: 0, height: 0 },
						unwrapped: createScreenTransitionState(
							motion.route,
							motion.meta,
							motion.options,
						),
					}
				: undefined,
		[motion],
	);
}
