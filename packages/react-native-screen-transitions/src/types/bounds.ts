import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { BoundsBuilderOptions } from "../utils/bounds/_types/builder";
import type { ScreenPhase } from "./core";

/**
 * Target style computation.
 * - "transform": translates and scales (scaleX/scaleY), no width/height size
 * - "size": translates and sizes (width/height), no scaleX/scaleY
 * - "content": screen-level content transform that aligns the destination screen
 *   so the target bound matches the source at progress start
 */
export type BoundsMethod = "transform" | "size" | "content";

export type BoundsBuilder = {
	/**
	 * Include gesture offsets (x/y) in the computed transform for all methods.
	 * This syncs the focused screen’s gesture deltas with the previous screen’s bound
	 * to give the shared look while interacting.
	 */
	gestures: (options?: { x?: number; y?: number }) => BoundsBuilder;

	/**
	 * Animate to the full screen bounds as the destination.
	 * Useful when the next screen does not define a bound for the same id.
	 */
	toFullscreen: () => BoundsBuilder;

	/**
	 * Compute using absolute window coordinates (pageX/pageY).
	 * No relative delta math—good when elements are unconstrained by parent layout.
	 */
	absolute: () => BoundsBuilder;

	/**
	 * Compute using relative deltas between start/end bounds (dx/dy, scale).
	 * This makes the math bound-relative; great when elements are within layout constraints.
	 */
	relative: () => BoundsBuilder;

	/**
	 * Select transform method: translate + scaleX/scaleY (no width/height size).
	 * Note: x/y translation is applied for all methods when applicable.
	 */
	transform: () => BoundsBuilder;

	/**
	 * Select size method: translate + width/height interpolation (no scaleX/scaleY).
	 */
	size: () => BoundsBuilder;

	/**
	 * Select content method: screen-level transform to align destination content
	 * so its bound matches the source at progress start. This modifies where the
	 * bound sits within the screen rather than the bound’s own local transform.
	 */
	content: () => BoundsBuilder;

	/**
	 * Select content scale mode: "aspectFill" (fill), "aspectFit" (fit), or "auto" (default).
	 */
	contentFill: () => BoundsBuilder;

	/**
	 * Select content scale mode: "aspectFill" (fill), "aspectFit" (fit), or "auto" (default).
	 */
	contentFit: () => BoundsBuilder;

	/**
	 * Build the final animated style.
	 * If a method is not explicitly selected via transform/resize/content,
	 * the provided argument will be used; defaults to "transform".
	 */
	build: (method?: BoundsMethod) => StyleProps;
};

export type BoundEntry = {
	bounds: MeasuredDimensions;
	styles: StyleProps;
};

export type BoundsAccessor = ((
	id?: string | BoundsBuilderOptions,
) => BoundsBuilder | StyleProps) & {
	get: (id?: string, phase?: ScreenPhase) => BoundEntry;
};
