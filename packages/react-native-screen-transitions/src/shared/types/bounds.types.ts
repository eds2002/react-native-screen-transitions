import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { Snapshot } from "../stores/bounds";
import type {
	BoundId,
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

export type BoundsNavigationZoomOptions = {
	anchor?: BoundsAnchor;
	scaleMode?: BoundsScaleMode;
	target?: "bound" | "fullscreen" | MeasuredDimensions;
	mask?: {
		borderRadius?: number | "auto" | { from?: number; to?: number };
		borderTopLeftRadius?: number | "auto" | { from?: number; to?: number };
		borderTopRightRadius?: number | "auto" | { from?: number; to?: number };
		borderBottomLeftRadius?: number | "auto" | { from?: number; to?: number };
		borderBottomRightRadius?: number | "auto" | { from?: number; to?: number };
		borderCurve?: "circular" | "continuous";
		outset?:
			| number
			| { top?: number; right?: number; bottom?: number; left?: number };
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
