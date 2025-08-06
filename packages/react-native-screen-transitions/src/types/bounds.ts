import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";

export type BoundsBuilder = {
	/**
	 * Include gesture offsets (x/y) in the computed transform.
	 * Useful when the transition should be gesture-driven or partially interactive.
	 */
	withGestures: (options?: { x?: number; y?: number }) => BoundsBuilder;

	/**
	 * Set the target bounds to the full screen dimensions.
	 * Pairs well with absolute() to compute absolute translation/scale
	 * or with relative() to compute deltas from the current element.
	 */
	toFullscreen: () => BoundsBuilder;

	/**
	 * Compute styles in absolute (screen) coordinates using raw measurements
	 * between the start and end bounds. Produces absolute translateX/translateY values.
	 */
	absolute: () => BoundsBuilder;

	/**
	 * Compute styles relative to the start bounds. Produces deltas for translation
	 * (e.g., move from dx/dy to 0/0) and interpolates width/height accordingly.
	 */
	relative: () => BoundsBuilder;

	/**
	 * Build animated transform style to move/scale the element between bounds.
	 * This uses translateX/translateY (and optionally scaleX/scaleY) without resizing.
	 * Honors absolute()/relative() and withGestures().
	 */
	toTransformStyle: () => StyleProps;

	/**
	 * Build animated resize style to morph the element's width/height between bounds.
	 * Also provides translation depending on absolute()/relative():
	 * - absolute(): translates from start.pageX/Y to end.pageX/Y
	 * - relative(): translates from dx/dy to 0/0
	 */
	toResizeStyle: () => StyleProps;
	/**
	 * Build animated content style to animate the element's position/scale/rotation
	 * between bounds. Honors absolute()/relative() and withGestures().
	 */
	toContentStyle: () => StyleProps;
};

export type BoundEntry = {
	bounds: MeasuredDimensions;
	styles: StyleProps;
};

export type BoundsAccessor = (id?: string) => BoundsBuilder;
