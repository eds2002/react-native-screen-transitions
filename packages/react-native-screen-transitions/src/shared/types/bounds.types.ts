import type { ColorValue } from "react-native";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../constants";
import type { BoundsLink } from "../stores/bounds/types";
import type {
	BoundsComputeOptions,
	BoundsIdentityInput,
	BoundsMotion,
	BoundsMotionFrame,
	BoundsMotionTransform,
	BoundsStyleResult,
	BoundsValuesResult,
} from "../utils/bounds/types/options";
import type {
	ScreenInterpolationProps,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "./animation.types";
import type { GestureProgressMode } from "./gesture.types";

export type { BoundsLink, BoundsLinkStatus } from "../stores/bounds/types";

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

/**
 * Legacy zoom opacity interpolation tuple.
 *
 * @deprecated Zoom opacity ownership now follows the native preset.
 */
export type BoundsNavigationZoomOpacityRange = readonly [
	inputStart: number,
	inputEnd: number,
	outputStart?: number,
	outputEnd?: number,
];

/**
 * Legacy opening and closing zoom opacity ranges.
 *
 * @deprecated Zoom opacity ownership now follows the native preset.
 */
export type BoundsNavigationZoomOpacityRanges = {
	open?: BoundsNavigationZoomOpacityRange;
	close?: BoundsNavigationZoomOpacityRange;
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
	 * of whether a navigation mask is enabled.
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
	/**
	 * @deprecated Ignored. Zoom no longer exposes a transition-specific debug
	 * overlay.
	 */
	debug?: boolean;
	/**
	 * @deprecated Ignored. Zoom opacity ownership now follows the native preset.
	 */
	focusedElementOpacity?: BoundsNavigationZoomOpacityRanges;
	/**
	 * @deprecated Ignored. Zoom opacity ownership now follows the native preset.
	 */
	unfocusedElementOpacity?: BoundsNavigationZoomOpacityRanges;
	/**
	 * @deprecated Ignored. Zoom now owns its gesture sensitivity curve.
	 */
	maxSensitivity?: number;
	/**
	 * @deprecated Ignored. Zoom now owns its velocity-depth behavior.
	 */
	velocityDepth?: number;
	/**
	 * @deprecated Ignored. Gesture movement always contributes to `progress`.
	 */
	gestureProgressMode?: GestureProgressMode;
	/**
	 * @deprecated Ignored. Use `drag.scale.horizontal` to adjust response
	 * intensity without replacing the native curve.
	 */
	horizontalDragScale?: readonly [
		shrinkMin: number,
		growMax: number,
		exponent?: number,
	];
	/**
	 * @deprecated Ignored. Use `drag.scale.vertical` to adjust response intensity
	 * without replacing the native curve.
	 */
	verticalDragScale?: readonly [
		shrinkMin: number,
		growMax: number,
		exponent?: number,
	];
	/**
	 * @deprecated Ignored. Use `drag.translation.horizontal` to adjust response
	 * intensity without replacing the native curve.
	 */
	horizontalDragTranslation?: readonly [
		negativeMax: number,
		positiveMax: number,
		exponent?: number,
	];
	/**
	 * @deprecated Ignored. Use `drag.translation.vertical` to adjust response
	 * intensity without replacing the native curve.
	 */
	verticalDragTranslation?: readonly [
		negativeMax: number,
		positiveMax: number,
		exponent?: number,
	];
};

export type BoundsNavigationZoomStyle = TransitionInterpolatedStyle & {
	content?: TransitionSlotStyle;
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: TransitionSlotStyle;
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: TransitionSlotStyle;
};

export type BoundsNavigationRevealOptions = {
	/**
	 * Destination mask border radius.
	 *
	 * Reveal interpolates from the measured source border radius to this value.
	 *
	 * @default Platform-specific reveal radius
	 */
	borderRadius?: number;
	/**
	 * Whether the reveal mask should use React Native's continuous border curve.
	 *
	 * @default true
	 */
	borderContinuous?: boolean;
	/**
	 * Maximum dynamic gesture sensitivity applied by reveal.
	 *
	 * Reveal lowers gesture sensitivity as the drag gets deeper so the masked
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
	 * Deprecated compatibility option.
	 *
	 * Gesture movement now always contributes to `progress`; use `transitionProgress`
	 * when a recipe needs transition progress without live gesture contribution.
	 * The reveal helper no longer reads this option.
	 *
	 * @deprecated Use `transitionProgress` from interpolation state instead.
	 */
	gestureProgressMode?: GestureProgressMode;
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
	/**
	 * How reveal should resize the navigation mask element.
	 *
	 * `"auto"` uses the platform default. Android defaults to transform-based
	 * resizing to avoid masked-size animation cost, while other platforms animate
	 * width and height. Transform-based resizing can make large border radii look
	 * less natural on Android; use `"size"` to force width/height animation when
	 * radius quality is more important than that optimization.
	 *
	 * @default "auto"
	 */
	maskSizingMode?: "auto" | "transform" | "size";
};

export type BoundsNavigationRevealStyle = BoundsNavigationZoomStyle;

export type BoundsNavigationAccessor = {
	zoom: (options?: BoundsNavigationZoomOptions) => BoundsNavigationZoomStyle;
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
	/**
	 * @deprecated Use {@linkcode values}.
	 */
	math: <T extends BoundsComputeOptions = BoundsComputeOptions>(
		options?: T,
	) => BoundsValuesResult<T>;
	link: (id?: BoundsIdentityInput) => BoundsLink | null;
};

export type BoundsAccessor = (
	options: BoundsIdentityInput,
) => BoundsScopedAccessor;

export type BoundsInterpolationProps = Omit<
	ScreenInterpolationProps,
	"bounds" | "transition"
>;

export type { BoundsMotion, BoundsMotionFrame, BoundsMotionTransform };
