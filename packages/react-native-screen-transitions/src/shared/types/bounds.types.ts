import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../constants";
import type { Snapshot } from "../stores/bounds";
import type {
	BoundId,
	BoundsOptions,
	BoundsOptionsResult,
} from "../utils/bounds/types/options";
import type {
	ScreenInterpolationProps,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "./animation.types";

/**
 * Target style computation.
 * - "transform": translates and scales (scaleX/scaleY), no width/height size
 * - "size": translates and sizes (width/height), no scaleX/scaleY
 * - "content": screen-level content transform that aligns the destination screen
 *   so the target bound matches the source at progress start
 */
export type BoundsMethod = "transform" | "size" | "content";

export type BoundEntry = {
	bounds: MeasuredDimensions;
	styles: StyleProps;
};

export type BoundsLink = {
	source: BoundEntry | null;
	destination: BoundEntry | null;
};

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

export type BoundsNavigationAccessor = {
	zoom: (options?: BoundsNavigationZoomOptions) => BoundsNavigationZoomStyle;
};

type BoundsBoundNavigationAccessor = {
	navigation: BoundsNavigationAccessor;
};

type BoundsCallResult<T extends BoundsOptions> = BoundsOptionsResult<T> &
	BoundsBoundNavigationAccessor;

export type BoundsAccessor = {
	<T extends BoundsOptions>(options: T): BoundsCallResult<T>;
	getSnapshot: (id: BoundId, key?: string) => Snapshot | null;
	getLink: (id: BoundId) => BoundsLink | null;
	interpolateStyle: (
		id: BoundId,
		property: keyof StyleProps,
		fallback?: number,
	) => number;
	interpolateBounds: (
		id: BoundId,
		property: keyof MeasuredDimensions,
		fallbackOrTargetKey?: number | string,
		fallback?: number,
	) => number;
};
