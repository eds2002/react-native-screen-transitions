import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { Snapshot } from "../stores/bounds";
import type {
	BoundsAnchor,
	BoundsOptions,
	BoundsOptionsResult,
	BoundsScaleMode,
} from "../utils/bounds/types/options";
import type { TransitionInterpolatedStyle } from "./animation.types";

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

export type BoundsStyleOptions = Omit<BoundsOptions, "id" | "group">;

export type BoundsNavigationPreset = "zoom";

export type ZoomEdgeInsets =
	| number
	| { top?: number; right?: number; bottom?: number; left?: number };

export type ZoomRadiusValue = number | "auto" | { from?: number; to?: number };

export type BoundsNavigationZoomOptions = {
	anchor?: BoundsAnchor;
	scaleMode?: BoundsScaleMode;
	target?: "bound" | "fullscreen" | MeasuredDimensions;
	mask?: {
		borderRadius?: ZoomRadiusValue;
		borderTopLeftRadius?: ZoomRadiusValue;
		borderTopRightRadius?: ZoomRadiusValue;
		borderBottomLeftRadius?: ZoomRadiusValue;
		borderBottomRightRadius?: ZoomRadiusValue;
		borderCurve?: "circular" | "continuous";
		outset?: ZoomEdgeInsets;
	};
	motion?: {
		dragResistance?: number;
		dragDirectionalScaleMin?: number;
	};
	/**
	 * @deprecated Use `mask.borderRadius` instead.
	 */
	maskBorderRadius?: number;
};

/**
 * @deprecated Use `BoundsNavigationZoomOptions`.
 */
export type BoundsNavigationOptions = BoundsNavigationZoomOptions;

export type BoundsNavigationAccessor = {
	zoom: (options?: BoundsNavigationZoomOptions) => TransitionInterpolatedStyle;
};

type BoundsBoundNavigationAccessor = {
	navigation: BoundsNavigationAccessor;
};

type BoundsCallResult<T extends BoundsOptions> = BoundsOptionsResult<T> &
	BoundsBoundNavigationAccessor;

export type BoundsAccessor = {
	<T extends BoundsOptions>(options: T): BoundsCallResult<T>;
	getSnapshot: (id: string, key?: string) => Snapshot | null;
	getLink: (id: string) => BoundsLink | null;
	interpolateStyle: (
		id: string,
		property: keyof StyleProps,
		fallback?: number,
	) => number;
	interpolateBounds: (
		id: string,
		property: keyof MeasuredDimensions,
		fallbackOrTargetKey?: number | string,
		fallback?: number,
	) => number;
};
