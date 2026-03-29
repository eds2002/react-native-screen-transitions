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

export type BoundsInterpolationProps = Omit<
	ScreenInterpolationProps,
	"bounds"
> & {
	navigationMaskEnabled?: boolean;
};
