import {
	type ChainTarget,
	resolveChainTarget,
} from "../../../../utils/resolve-chain-target";
import { useOptionalScreenGestureStore } from "../gestures.provider";

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
	const ctx = useOptionalScreenGestureStore();

	return (
		resolveChainTarget({
			target,
			self: ctx,
			ancestors: ctx?.ancestorGestures ?? [],
		})?.panGesture ?? null
	);
};
