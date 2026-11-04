import { useMemo, useState } from "react";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_STATE,
} from "../../../constants";
import type {
	BuiltState,
	MotionAnimationState,
} from "../../motion/animation/helpers/hydrate-transition-state/types";

// Shared motion inputs can be read by multiple orchestrators. Only the output
// objects are local, so one reader's overrides cannot mutate another's frame.
export function useInterpolatorState(
	motion: MotionAnimationState | null,
): BuiltState | undefined {
	// The UI output survives descriptor updates; hydration owns its contents.
	const [unwrapped] = useState(() =>
		createScreenTransitionState(
			motion?.route ?? DEFAULT_SCREEN_TRANSITION_STATE.route,
		),
	);
	return useMemo(
		() =>
			motion
				? {
						transitionProgress: motion.transitionProgress,
						visualProgress: motion.visualProgress,
						willAnimate: motion.willAnimate,
						progressAnimating: motion.progressAnimating,
						progressSettled: motion.progressSettled,
						closing: motion.closing,
						entering: motion.entering,
						route: motion.route,
						meta: motion.meta,
						options: motion.options,
						targetProgress: motion.targetProgress,
						resolvedAutoSnapPoint: motion.resolvedAutoSnapPoint,
						measuredContentLayout: motion.measuredContentLayout,
						scrollMetadata: motion.scrollMetadata,
						hasAutoSnapPoint: motion.hasAutoSnapPoint,
						sortedNumericSnapPoints: motion.sortedNumericSnapPoints,
						gesture: {
							x: motion.x,
							y: motion.y,
							normX: motion.normX,
							normY: motion.normY,
							velocity: motion.velocity,
							scale: motion.scale,
							normScale: motion.normScale,
							focalX: motion.focalX,
							focalY: motion.focalY,
							pinchOriginX: motion.pinchOriginX,
							pinchOriginY: motion.pinchOriginY,
							rotation: motion.rotation,
							raw: motion.raw,
							dismissing: motion.dismissing,
							dragging: motion.dragging,
							settling: motion.settling,
							initiator: motion.initiator,
							internal: {
								progressDeltaX: motion.internal.progressDeltaX,
								progressDeltaY: motion.internal.progressDeltaY,
								snapshot: motion.internal.snapshot,
							},
						},
						optionsSlot: {},
						contentLayoutSlot: { width: 0, height: 0 },
						unwrapped,
					}
				: undefined,
		[motion, unwrapped],
	);
}
