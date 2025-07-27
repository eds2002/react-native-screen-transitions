/**
 * Necessary screen options to ensure animations run smoothly
 */
export const DEFAULT_SCREEN_OPTIONS = {
	presentation: "containedTransparentModal",
	headerShown: false,
	animation: "none",
	/**
   * EXPERIMENTAL:
   When handling forward navigation, this would be the prop we would use to prevent the underlying screen from not being interactable.
    - pointerEvents: "box-none",
   */
} as const;

/**
 * Lib handles gestures. Default props to avoid conflicts with navigator
 */
export const CONFLICTING_SCREEN_OPTIONS = {
	gestureEnabled: false,
	gestureDirection: "horizontal",
} as const;
