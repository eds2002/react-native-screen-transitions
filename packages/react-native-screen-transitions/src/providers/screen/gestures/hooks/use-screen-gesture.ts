import { useResolvedTransitionKey } from "../../topology";
import { useOptionalScreenGestureStore } from "../gestures.provider";

export type ScreenGestureTarget = { depth: number };

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
	const localGesture = useOptionalScreenGestureStore();
	const usesLocalStore = target === undefined || target.depth === 0;
	const screenKey = useResolvedTransitionKey(
		localGesture?.routeKey ?? null,
		target,
	);
	const keyedGesture = useOptionalScreenGestureStore(
		usesLocalStore ? null : screenKey,
		(store) => store.panGesture,
	);

	return usesLocalStore ? (localGesture?.panGesture ?? null) : keyedGesture;
};
