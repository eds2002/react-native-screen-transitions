import { useResolvedTransitionKey } from "../../../../builder/topology";
import { useOptionalMotionStore } from "../../..";

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
	const localGesture = useOptionalMotionStore(
		(store) => store?.gestures ?? null,
	);
	const usesLocalStore = target === undefined || target.depth === 0;
	const screenKey = useResolvedTransitionKey(
		localGesture?.routeKey ?? null,
		target,
	);
	const keyedGesture = useOptionalMotionStore(
		usesLocalStore ? null : screenKey,
		(store) => store.gestures.panGesture,
	);

	return usesLocalStore ? (localGesture?.panGesture ?? null) : keyedGesture;
};
