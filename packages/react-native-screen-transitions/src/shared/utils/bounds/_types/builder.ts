import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { ScreenTransitionState } from "../../../types/animation";
import type { BoundsMethod } from "../../../types/bounds";
import type { Layout } from "../../../types/core";

export type BoundsAnchor =
	| "topLeading"
	| "top"
	| "topTrailing"
	| "leading"
	| "center"
	| "trailing"
	| "bottomLeading"
	| "bottom"
	| "bottomTrailing";

export type BoundsScaleMode = "match" | "none" | "uniform";

export type BoundsTarget = "bound" | "fullscreen" | MeasuredDimensions;

export type BoundsSpace = "relative" | "absolute";

export type BoundsComputeParams = {
	id: string | null;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	dimensions: Layout;
};

export type RawSizeAbsoluteReturn = {
	width: number;
	height: number;
	translateX: number;
	translateY: number;
};

export type RawSizeRelativeReturn = {
	translateX: number;
	translateY: number;
	width: number;
	height: number;
};

export type RawTransformAbsoluteReturn = {
	translateX: number;
	translateY: number;
	scaleX: number;
	scaleY: number;
};

export type RawTransformRelativeReturn = {
	translateX: number;
	translateY: number;
	scaleX: number;
	scaleY: number;
};

export type RawContentReturn = {
	translateX: number;
	translateY: number;
	scale: number;
};

// Conditional return type based on options
export type BoundsReturnType<T extends BoundsBuilderOptions> =
	T["raw"] extends true
		? T["method"] extends "size"
			? T["space"] extends "absolute"
				? RawSizeAbsoluteReturn
				: RawSizeRelativeReturn
			: T["method"] extends "content"
				? RawContentReturn
				: T["space"] extends "absolute"
					? RawTransformAbsoluteReturn
					: RawTransformRelativeReturn
		: StyleProps;

export type BoundsBuilderOptions = {
	/**
	 * The ID of the bound to compute bounds for. If not provided, uses the active bound ID.
	 */
	id?: string;

	/**
	 * The method to use to compute the bounds.
	 *
	 * - "transform": translates and scales (scaleX/scaleY), no width/height size
	 * - "size": translates and sizes (width/height), no scaleX/scaleY
	 * - "content": screen-level content transform that aligns the destination screen
	 *   so the target bound matches the source at progress start
	 * @default "transform"
	 */
	method?: BoundsMethod;

	/**
	 * The space to use to compute the bounds.
	 *
	 * - "relative": the bounds are computed with relative deltas, constrained by parent layout
	 * - "absolute": the bounds are computed with absolute coordinates, unconstrained by parent layout
	 * @default "relative"
	 */
	space?: BoundsSpace;
	/**
	 * The gesture offsets to apply to the bounds.
	 */
	gestures?: { x?: number; y?: number };
	/**
	 * How the bounds should be scaled between each other.
	 * @default "match"
	 */
	scaleMode?: BoundsScaleMode;
	/**
	 * Where the bounds should be anchored between each other.
	 * @default "center"
	 */
	anchor?: BoundsAnchor;
	/**
	 * If true, the raw values will be returned instead of the computed values.
	 * @default false
	 */
	raw?: boolean;

	/**
	 * Whether the bound should target the screen or the bound.
	 * @deprecated
	 */
	target?: BoundsTarget;
};
