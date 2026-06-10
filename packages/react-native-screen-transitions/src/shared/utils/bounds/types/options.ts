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

/**
 * Transform values exposed to a bounds motion resolver.
 *
 * `x` and `y` map to the generated translate values. `scale` is a uniform scale
 * view of the generated transform; non-uniform bounds transforms keep their
 * existing `scaleX`/`scaleY` ratio and apply returned `scale` as a multiplier.
 */
export type BoundsMotionTransform = {
	x: number;
	y: number;
	scale: number;
};

/**
 * Frame data passed to a bounds motion resolver.
 *
 * `progress` is normalized to the current bounds phase, from `0` at `from` to
 * `1` at `to`. `transitionProgress` is the screen transition's raw progress.
 */
export type BoundsMotionFrame = {
	progress: number;
	transitionProgress: number;
	entering: boolean;
	from: BoundsMotionTransform;
	to: BoundsMotionTransform;
	current: BoundsMotionTransform;
	start: MeasuredDimensions;
	end: MeasuredDimensions;
};

/**
 * Worklet-safe function that can replace the generated bounds transform.
 *
 * Use this from `bounds({ motion })` to bend, delay, overshoot, or otherwise
 * reshape a bounds transform without reimplementing the measurement logic.
 */
export type BoundsMotion = (frame: BoundsMotionFrame) => BoundsMotionTransform;

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
	 * Worklet-safe transform resolver for bounds output.
	 *
	 * `motion` receives the generated transform and returns the transform that
	 * should be rendered or returned from raw bounds. For `"size"` methods,
	 * returned `scale` is applied to the generated width and height.
	 */
	motion?: BoundsMotion;

	/**
	 * If true, the raw values will be returned instead of the computed values.
	 * @default false
	 */
	raw?: boolean;
};
