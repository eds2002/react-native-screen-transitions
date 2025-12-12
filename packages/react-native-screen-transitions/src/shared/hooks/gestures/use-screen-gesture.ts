import { useGestureContext } from "../../providers/gestures.provider";

/**
 * Returns a ref to the screen's navigation pan gesture.
 * Use this to coordinate child gestures with the navigation gesture.
 *
 * @example
 * ```tsx
 * const screenGesture = useScreenGesture();
 *
 * const myPanGesture = Gesture.Pan()
 *   .waitFor(screenGesture) // Wait for navigation gesture to fail first
 *   .onUpdate(...);
 * ```
 */
export const useScreenGesture = () => {
	const ctx = useGestureContext();
	return ctx?.panGestureRef ?? null;
};
