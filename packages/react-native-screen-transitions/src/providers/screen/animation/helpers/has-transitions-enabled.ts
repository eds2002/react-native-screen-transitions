import type { ScreenTransitionConfig } from "../../../../types";

/**
 * Helper for compatibility with NativeStack. Native stack integration requires
 * the `enableTransitions` prop for creating custom animations, however, blank
 * stack animations are always on.
 */
export const hasTransitionsEnabled = (
	options: ScreenTransitionConfig | undefined,
	alwaysOn: boolean,
) => {
	if (alwaysOn) return true;
	return !!(options as any)?.enableTransitions;
};
