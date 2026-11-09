import type { ColorValue } from "react-native";
import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../navigation-mask-ids";
import type { ScreenTransform } from "../utils/bounds/types/geometry";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "./animation.types";
import type { ScrollChainSnapshot, ScrollMetadataState } from "./gesture.types";
import type { Layout, ScreenKey } from "./screen.types";

/**
 * Target style computation.
 * - "transform": translates and scales (scaleX/scaleY), no width/height size
 * - "size": translates and sizes (width/height), no scaleX/scaleY
 * - "content": screen-level content transform that aligns the destination screen
 *   so the target bound matches the source at progress start
 */
export type BoundsMethod = "transform" | "size" | "content";

/**
 * Axis-specific response intensity used by {@linkcode BoundsNavigationZoomDragOptions}.
 *
 * `0` disables the response on an axis, `1` preserves the native zoom preset,
 * and values above `1` exaggerate it.
 */
export type BoundsNavigationZoomAxisResponse = {
	/** Horizontal gesture response multiplier. @default 1 */
	horizontal?: number;
	/** Vertical gesture response multiplier. @default 1 */
	vertical?: number;
};

/**
 * Adjusts the intensity of zoom's native drag behavior without replacing its
 * built-in curves.
 *
 * @see {@linkcode BoundsNavigationZoomOptions.drag}
 */
export type BoundsNavigationZoomDragOptions = {
	/**
	 * Multiplies the native rendered translation.
	 *
	 * @default { horizontal: 1, vertical: 1 }
	 */
	translation?: BoundsNavigationZoomAxisResponse;
	/**
	 * Multiplies the native scale displacement from `1`.
	 *
	 * @default { horizontal: 1, vertical: 1 }
	 */
	scale?: BoundsNavigationZoomAxisResponse;
};

export type BoundsNavigationZoomOptions = {
	/**
	 * Geometry that the zoomed content should resolve against.
	 *
	 * `"bound"` uses the paired destination boundary. `"fullscreen"` uses the
	 * screen, and measured dimensions provide an explicit target rectangle.
	 * When omitted, zoom keeps its native full-width aspect-ratio target.
	 */
	target?: BoundsComputeOptions["target"];
	/**
	 * Keeps the focused screen content visible throughout the zoom.
	 *
	 * Enable this for handed-off or live content that should not use zoom's
	 * built-in focused-content opacity fade.
	 *
	 * @default false
	 */
	keepFocusedVisible?: boolean;
	/**
	 * Expanded transition clipping radius.
	 *
	 * Zoom interpolates from the measured source radius to this value while the
	 * screen is animating. This controls the visible clipping result regardless
	 * of the clipping rectangle.
	 *
	 * @default 64
	 */
	borderRadius?: number;
	/**
	 * Scale applied to the unfocused screen while the zoom runs above it.
	 *
	 * @default 0.9375
	 */
	backgroundScale?: number;
	/**
	 * Color rendered behind the focused zoom content.
	 *
	 * @default "black"
	 */
	backdropColor?: ColorValue;
	/**
	 * Maximum opacity reached by the zoom backdrop.
	 *
	 * Values are clamped between `0` and `1`.
	 *
	 * @default 0.45
	 */
	backdropOpacity?: number;
	/**
	 * Native drag-response intensity controls.
	 */
	drag?: BoundsNavigationZoomDragOptions;
};

export type BoundsNavigationZoomStyle = TransitionInterpolatedStyle & {
	content?: TransitionSlotStyle;
	/** @deprecated Ignored. Return `clip` geometry instead. */
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: TransitionSlotStyle;
	/** @deprecated Ignored. Return `clip` geometry instead. */
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: TransitionSlotStyle;
};

/** @deprecated `navigation.reveal()` is deprecated: use `navigation.zoom()`. */
export type BoundsNavigationRevealOptions = {
	/**
	 * Destination clip border radius.
	 *
	 * Reveal interpolates from the measured source border radius to this value.
	 *
	 * @default Platform-specific reveal radius
	 */
	borderRadius?: number;
	/**
	 * Whether the reveal clip should use React Native's continuous border curve.
	 *
	 * @default true
	 */
	borderContinuous?: boolean;
	/**
	 * Maximum dynamic gesture sensitivity applied by reveal.
	 *
	 * Reveal lowers gesture sensitivity as the drag gets deeper so the clipped
	 * container can keep its source-to-destination handoff stable. This value
	 * controls the starting/highest sensitivity in that curve.
	 *
	 * @default 0.8
	 */
	maxSensitivity?: number;
	/**
	 * Velocity-driven depth applied to the dismiss scale handoff.
	 *
	 * Higher values make fast releases orbit farther around the final source
	 * scale. Set to `0` to remove the velocity depth effect.
	 *
	 * @default 0.5
	 */
	velocityDepth?: number;
	/**
	 * Scale applied to the unfocused background content while the reveal runs
	 * above it.
	 *
	 * @default 0.9375
	 */
	backgroundScale?: number;
	/**
	 * Whether reveal should reset the unfocused background content scale once the
	 * transition is visually settled.
	 *
	 * By default, reveal restores the background to scale `1` after settle so the
	 * next drag or programmatic dismiss starts from a fresh, unmodified layout
	 * measurement. Keeping the background transformed while idle can make the next
	 * measurement read the scaled screen instead of the real screen geometry.
	 *
	 * @default true
	 */
	shouldBackgroundScaleResetOnSettled?: boolean;
	/**
	 * Temporarily blocks pointer-event pass-through on the inactive content until
	 * the source element transition handoff reaches progress `0.25`.
	 *
	 * This is intentional and most users cannot react fast enough to swipe during
	 * that brief handoff. If it becomes an issue, set this to `false` to disable
	 * the guard and keep the default behavior that allows pointer events to pass
	 * through.
	 *
	 * @default true
	 */
	disablePointerEventsTillElementTransition?: boolean;
	/** @deprecated Ignored. Reveal uses built-in clipping on every platform. */
	maskSizingMode?: "auto" | "transform" | "size";
};

/** @deprecated `navigation.reveal()` is deprecated: use `navigation.zoom()`. */
export type BoundsNavigationRevealStyle = BoundsNavigationZoomStyle;

export type BoundsNavigationAccessor = {
	zoom: (options?: BoundsNavigationZoomOptions) => BoundsNavigationZoomStyle;
	/**
	 * @deprecated Use `zoom()`, the default navigation transition for bounds. `reveal()` keeps
	 * working but won't get new behaviour or fixes.
	 */
	reveal: (
		options?: BoundsNavigationRevealOptions,
	) => BoundsNavigationRevealStyle;
};

type BoundsBoundNavigationAccessor = {
	navigation: BoundsNavigationAccessor;
};

export type BoundsScopedAccessor = BoundsBoundNavigationAccessor & {
	styles: (options?: BoundsComputeOptions) => BoundsStyleResult;
	/** Returns numeric bounds values for custom style composition. */
	values: <T extends BoundsComputeOptions = BoundsComputeOptions>(
		options?: T,
	) => BoundsValuesResult<T>;
	link: (id?: BoundsIdentityInput) => BoundsLink | null;
};

export type BoundsAccessor = (
	options: BoundsIdentityInput,
) => BoundsScopedAccessor;

export type BoundsInterpolationProps = Omit<ScreenInterpolationProps, "bounds">;

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
export type BoundsOptionsResult<T extends BoundsInternalOptions> =
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
	 * Progress value used to drive the bounds interpolation.
	 *
	 * Defaults to the interpolator frame's combined visual progress. Pass
	 * `transitionProgress` when bounds geometry should ignore live gesture
	 * progress and layer gesture movement separately.
	 */
	progress?: number;

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
};

export type BoundsInternalOptions = BoundsOptions & { raw?: boolean };

export type BoundsIdentity = {
	id: BoundId;
	group?: string;
};

export type BoundsIdentityInput = BoundId | BoundsIdentity;

export type BoundsComputeOptions = Omit<BoundsOptions, "group" | "id">;

export type BoundsStyleResult = StyleProps;

export type BoundsValuesResult<
	T extends BoundsComputeOptions = BoundsComputeOptions,
> = BoundsOptionsResult<T & { id: BoundId; raw: true }>;

/** Links: a boundary measured on both screens of a transition (the bounds store's records). */

/**
 * A boundary's box as measured (window space), with what was true when it was measured: how its
 * screen was drawn, the scroll positions around it, and where it sits in its screen's content.
 */
export type MeasuredBounds = MeasuredDimensions & {
	/** How the boundary's screen was drawn (a box measured on a moved or scaled screen). */
	screenTransform?: ScreenTransform;
	scroll?: ScrollMetadataState | null;
	/** The scrollables around the boundary and their offsets when it was measured. */
	scrollChain?: readonly ScrollChainSnapshot[];
	/** Where the boundary sits inside its screen's content (see measureScreenAt). */
	contentOffset?: { x: number; y: number; width: number; height: number };
};

export type TagID = string;
export type GroupKey = string;

export type BoundaryRuntimeFlags = {
	handoff?: boolean;
};

/** How a boundary is laid out against its partner: the bounds options a Boundary takes as props. */
export type BoundaryConfig = Pick<
	BoundsOptions,
	"anchor" | "scaleMode" | "target" | "method"
>;

export type Entry = {
	bounds: MeasuredBounds | null;
	styles: StyleProps;
	boundaryConfig?: BoundaryConfig;
} & BoundaryRuntimeFlags;

export type MeasuredEntry = Entry & {
	bounds: MeasuredBounds;
};

export type EntryPatch = {
	bounds?: MeasuredBounds | null;
	styles?: StyleProps | null;
	boundaryConfig?: BoundaryConfig | null;
	handoff?: boolean | null;
};

export type ScreenIdentifier = {
	screenKey: ScreenKey;
};

export type BoundsLinkStatus =
	| "source-incomplete"
	| "destination-incomplete"
	| "complete";

export type TagLinkSide = ScreenIdentifier & MeasuredEntry;
export type SourceTagLinkSide = TagLinkSide;

type TagLinkBase = {
	group?: GroupKey;
	/** First captured source side exposed for public link inspection. */
	initialSource?: TagLinkSide;
	/** First attached destination side, used to compensate reveal closes after destination refreshes. */
	initialDestination?: TagLinkSide;
};

export type TagLink =
	| (TagLinkBase & {
			status: "source-incomplete";
			/** Source side once attached; null while destination captured first. */
			source: null;
			/** Destination side once attached; null while the source is still pending. */
			destination: TagLinkSide | null;
	  })
	| (TagLinkBase & {
			status: "destination-incomplete";
			/** Source side once attached; null while destination captured first. */
			source: SourceTagLinkSide;
			/** Destination side once attached; null while the source is still pending. */
			destination: null;
	  })
	| (TagLinkBase & {
			status: "complete";
			/** Source side once attached; null while destination captured first. */
			source: SourceTagLinkSide;
			/** Destination side once attached; null while the source is still pending. */
			destination: TagLinkSide;
	  });

export type BoundsLink = TagLink & {
	id: TagID;
};
