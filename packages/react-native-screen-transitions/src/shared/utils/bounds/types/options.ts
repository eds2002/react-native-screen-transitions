import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { ScreenTransitionState } from "../../../types/animation.types";
import type { BoundsMethod } from "../../../types/bounds.types";
import type { Layout } from "../../../types/screen.types";

export type BoundId = string | number;

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

type BoundsTarget = "bound" | "fullscreen" | MeasuredDimensions;

type BoundsSpace = "relative" | "absolute";

export type BoundsComputeParams = {
	id?: BoundId;
	previous?: ScreenTransitionState;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	dimensions: Layout;
};

type RawSizeAbsoluteReturn = {
	width: number;
	height: number;
	translateX: number;
	translateY: number;
};

type RawSizeRelativeReturn = {
	translateX: number;
	translateY: number;
	width: number;
	height: number;
};

type RawTransformAbsoluteReturn = {
	translateX: number;
	translateY: number;
	scaleX: number;
	scaleY: number;
};

type RawTransformRelativeReturn = {
	translateX: number;
	translateY: number;
	scaleX: number;
	scaleY: number;
};

type RawContentReturn = {
	translateX: number;
	translateY: number;
	scale: number;
};

// Conditional return type based on options
export type BoundsOptionsResult<T extends BoundsOptions> = T["raw"] extends true
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

export type BoundsOptions = {
	/**
	 * The ID of the bound to compute bounds for.
	 * When `group` is also provided, this is the member id within the group (not the combined tag).
	 */
	id: BoundId;

	/**
	 * Optional group name for collection/list scenarios.
	 * When provided, concrete boundary entries use `group:id`, while transition
	 * links stay keyed by the member `id` inside the active screen pair.
	 */
	group?: string;

	/**
	 * Whether the bound should target the screen or the bound.
	 */
	target?: BoundsTarget;

	/**
	 * The method to use to compute the bounds.
	 *
	 * - "transform": translates and scales (scaleX/scaleY), no width/height size
	 * - "size": translates and sizes (width/height), no scaleX/scaleY
	 * - "content": screen-level content transform that aligns the current screen
	 *   so its bound matches the paired target bound during the transition
	 * @default "transform"
	 */
	method?: BoundsMethod;

	/**
	 * Coordinate space selection.
	 *
	 * - `"relative"` composes movement relative to the current element's layout box
	 * - `"absolute"` composes movement in screen/window coordinates
	 *
	 * @default "relative"
	 */
	space?: BoundsSpace;

	/**
	 * The x/y offsets to apply to the bounds.
	 */
	offset?: { x?: number; y?: number };

	/**
	 * The x/y offsets to apply to the bounds.
	 *
	 * @deprecated Use `offset` instead.
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
};
