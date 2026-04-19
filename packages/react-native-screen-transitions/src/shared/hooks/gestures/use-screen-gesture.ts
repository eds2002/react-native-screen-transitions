import { useGestureContext } from "../../providers/gestures";
import { resolveScreenGestureTarget } from "./resolve-screen-gesture-target";
import type { ScreenGestureTarget } from "./types";

export type { ScreenGestureTarget } from "./types";

/**
 * Returns a ref to a screen navigation pan gesture.
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
export const useScreenGesture = (target?: ScreenGestureTarget) => {
	const ctx = useGestureContext();
	return resolveScreenGestureTarget({
		target,
		self: ctx,
	});
};
