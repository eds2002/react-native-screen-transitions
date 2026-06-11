import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { ScreenTransitionState } from "../../../types/animation.types";
import type {
	BoundsInterpolationProps,
	BoundsMethod,
} from "../../../types/bounds.types";
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
 *
 * `rotateX`/`rotateY` are optional 3D tilts in degrees around the element
 * center. When either is set, a `perspective` entry is prepended to the
 * transform so the tilt projects in 3D.
 */
export type BoundsMotionTransform = {
	x: number;
	y: number;
	scale: number;
	/** Z-axis spin in degrees. */
	rotate?: number;
	rotateX?: number;
	rotateY?: number;
	/**
	 * Perspective distance, prepended to the transform when any rotation is
	 * present or when set explicitly.
	 * @default 1000
	 */
	perspective?: number;
	/**
	 * Pivot for the ENTIRE transform stack, including the generated
	 * translate/scale. Bounds geometry computes its translations assuming the
	 * default center origin, so non-center origins offset the path — best for
	 * rotation-dominant motion.
	 */
	transformOrigin?: string | Array<string | number>;
};

/**
 * Frame data passed to a bounds motion resolver: the generated transform
 * (`current`), the resolved rects it travels between (`start`/`end` — these
 * include target overrides and are not derivable from `props`), the phase
 * (`progress`, normalized 0→1 regardless of enter/exit range), and the
 * invoking interpolator's full `props`.
 *
 * `props` is screen-relative: the same motion can run under both the focused
 * and unfocused screen's interpolators, and values like `props.active.gesture`
 * differ per invocation. Direction is recoverable as `!props.next`; the raw
 * un-normalized progress as `props.progress`.
 */
export type BoundsMotionFrame = {
	progress: number;
	current: BoundsMotionTransform;
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	props: BoundsInterpolationProps;
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
	/** Invoking interpolator's props, surfaced to motion resolvers. */
	interpolationProps: BoundsInterpolationProps;
};

type RawMotionRotation = {
	/** Degrees; non-zero only when a motion resolver returned a rotation. */
	rotate: number;
	rotateX: number;
	rotateY: number;
	transformOrigin?: string | Array<string | number>;
};

type RawSizeAbsoluteReturn = RawMotionRotation & {
	width: number;
	height: number;
	translateX: number;
	translateY: number;
};

type RawSizeRelativeReturn = RawMotionRotation & {
	translateX: number;
	translateY: number;
	width: number;
	height: number;
};

type RawTransformAbsoluteReturn = RawMotionRotation & {
	translateX: number;
	translateY: number;
	scaleX: number;
	scaleY: number;
};

type RawTransformRelativeReturn = RawMotionRotation & {
	translateX: number;
	translateY: number;
	scaleX: number;
	scaleY: number;
};

type RawContentReturn = RawMotionRotation & {
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

export type BoundsIdentity = {
	id: BoundId;
	group?: string;
};

export type BoundsIdentityInput = BoundId | BoundsIdentity;

export type BoundsComputeOptions = Omit<BoundsOptions, "group" | "id" | "raw">;

export type BoundsStyleResult = StyleProps;

export type BoundsMathResult<
	T extends BoundsComputeOptions = BoundsComputeOptions,
> = BoundsOptionsResult<T & { id: BoundId; raw: true }>;
