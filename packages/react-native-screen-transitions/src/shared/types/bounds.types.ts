import type { MeasuredDimensions } from "react-native-reanimated";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../constants";
import type { BoundsLink } from "../stores/bounds/types";
import type {
	BoundsComputeOptions,
	BoundsIdentityInput,
	BoundsMathResult,
	BoundsMotion,
	BoundsMotionFrame,
	BoundsMotionTransform,
	BoundsStyleResult,
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

export type BoundsNavigationZoomOptions = {
	target?: "bound" | "fullscreen" | MeasuredDimensions;
	debug?: boolean;
	borderRadius?: number;
	/**
	 * Focused-screen element opacity curve.
	 *
	 * `open` is used while presenting the destination screen.
	 * `close` is used while returning to the source screen.
	 *
	 * Tuple order:
	 * - `inputStart`: transition progress start
	 * - `inputEnd`: transition progress end
	 * - `outputStart`: opacity at `inputStart` (defaults to built-in preset)
	 * - `outputEnd`: opacity at `inputEnd` (defaults to built-in preset)
	 */
	focusedElementOpacity?: BoundsNavigationZoomOpacityRanges;
	/**
	 * Unfocused-screen matched element opacity curve.
	 *
	 * `open` is used while the previous screen animates out during present.
	 * `close` is used while the previous screen animates back in during dismiss.
	 *
	 * Tuple order:
	 * - `inputStart`: transition progress start
	 * - `inputEnd`: transition progress end
	 * - `outputStart`: opacity at `inputStart` (defaults to built-in preset)
	 * - `outputEnd`: opacity at `inputEnd` (defaults to built-in preset)
	 */
	unfocusedElementOpacity?: BoundsNavigationZoomOpacityRanges;
	/**
	 * Scale applied to the unfocused background content while the focused bound
	 * animates above it.
	 */
	backgroundScale?: number;
	/**
	 * Maximum dynamic gesture sensitivity applied by zoom.
	 *
	 * Zoom lowers gesture sensitivity as the drag gets deeper so the content
	 * handoff stays stable. This value controls the starting/highest sensitivity
	 * in that curve.
	 *
	 * @default 0.8
	 */
	maxSensitivity?: number;
	/**
	 * Velocity-driven depth applied to the dismiss scale handoff.
	 *
	 * Higher values make fast releases orbit farther around the final scale. Set
	 * to `0` to remove the velocity depth effect.
	 *
	 * @default 0.5
	 */
	velocityDepth?: number;
	/**
	 * Whether gesture displacement should drive transition progress or remain as
	 * freeform gesture values. Zoom defaults to `"freeform"` so drag can move the
	 * content without owning the whole screen progress.
	 *
	 * @default "freeform"
	 */
	gestureProgressMode?: GestureProgressMode;
	/**
	 * Horizontal gesture drag scaling curve, applied when the active dismiss
	 * direction is horizontal.
	 *
	 * Tuple order:
	 * - `shrinkMin`: minimum scale when dragging toward dismissal
	 * - `growMax`: maximum scale when dragging opposite dismissal
	 * - `exponent`: curve exponent controlling how quickly scaling ramps
	 */
	horizontalDragScale?: readonly [
		shrinkMin: number,
		growMax: number,
		exponent?: number,
	];
	/**
	 * Vertical gesture drag scaling curve, applied when the active dismiss
	 * direction is vertical.
	 *
	 * Tuple order:
	 * - `shrinkMin`: minimum scale when dragging toward dismissal
	 * - `growMax`: maximum scale when dragging opposite dismissal
	 * - `exponent`: curve exponent controlling how quickly scaling ramps
	 */
	verticalDragScale?: readonly [
		shrinkMin: number,
		growMax: number,
		exponent?: number,
	];
	/**
	 * Horizontal gesture drag translation curve.
	 *
	 * Tuple order:
	 * - `negativeMax`: multiplier when dragging left / negative
	 * - `positiveMax`: multiplier when dragging right / positive
	 * - `exponent`: curve exponent controlling how quickly translation ramps
	 *
	 * Examples:
	 * - `[0, 0]` disables horizontal drag translation
	 * - `[0.5, 0.5]` halves horizontal drag travel
	 * - `[1.2, 1.2]` amplifies horizontal drag travel
	 */
	horizontalDragTranslation?: readonly [
		negativeMax: number,
		positiveMax: number,
		exponent?: number,
	];
	/**
	 * Vertical gesture drag translation curve.
	 *
	 * Tuple order:
	 * - `negativeMax`: multiplier when dragging up / negative
	 * - `positiveMax`: multiplier when dragging down / positive
	 * - `exponent`: curve exponent controlling how quickly translation ramps
	 *
	 * Examples:
	 * - `[0, 0]` disables vertical drag translation
	 * - `[0.5, 0.5]` halves vertical drag travel
	 * - `[1.2, 1.2]` amplifies vertical drag travel
	 */
	verticalDragTranslation?: readonly [
		negativeMax: number,
		positiveMax: number,
		exponent?: number,
	];
};

export type BoundsNavigationZoomOpacityRange = readonly [
	inputStart: number,
	inputEnd: number,
	outputStart?: number,
	outputEnd?: number,
];

export type BoundsNavigationZoomOpacityRanges = {
	open?: BoundsNavigationZoomOpacityRange;
	close?: BoundsNavigationZoomOpacityRange;
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
	 * Whether gesture displacement should drive transition progress or remain as
	 * freeform gesture values. Reveal defaults to `"freeform"` so drag can move
	 * the masked container without owning the whole screen progress.
	 *
	 * @default "freeform"
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
	math: <T extends BoundsComputeOptions = BoundsComputeOptions>(
		options?: T,
	) => BoundsMathResult<T>;
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
