import {
	type ChainTarget,
	resolveChainTarget,
} from "../../../../utils/resolve-chain-target";
import { useGestureContext } from "../gestures.provider";
import type { GestureContextType } from "../types";

export type ScreenGestureTarget = ChainTarget;

const getGestureAncestors = (
	self: GestureContextType,
): GestureContextType[] => {
	const ancestors: GestureContextType[] = [];

	let current = self.gestureContext;

	while (current) {
		ancestors.push(current);
		current = current.gestureContext;
	}

	return ancestors;
};

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
			ancestors: ctx ? getGestureAncestors(ctx) : [],
		})?.panGesture ?? null
	);
};
