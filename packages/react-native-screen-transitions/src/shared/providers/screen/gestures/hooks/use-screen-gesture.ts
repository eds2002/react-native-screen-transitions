import {
	type ChainTarget,
	resolveChainTarget,
} from "../../../../utils/resolve-chain-target";
import { useGestureContext } from "../gestures.provider";
import { walkGestureAncestors } from "../helpers/walk-gesture-ancestors";

export type ScreenGestureTarget = ChainTarget;

/**
 * Returns a screen navigation pan gesture.
 * Use this to coordinate child gestures with the navigation gesture.
 *
 * @example
 * ```tsx
 * const screenGesture = useScreenGesture();
 *
 * const myPanGesture = Gesture.Pan()
 *   .requireExternalGestureToFail(screenGesture)
 *   .onUpdate((...) => {});
 * ```
 */
export const useScreenGesture = (target?: ScreenGestureTarget) => {
	const ctx = useGestureContext();

	return (
		resolveChainTarget({
			target,
			self: ctx,
			ancestors: walkGestureAncestors(ctx?.gestureContext),
		})?.panGesture ?? null
	);
};
