import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { Snapshot } from "../stores/bounds.store";
import type {
	BoundsOptions,
	BoundsOptionsResult,
} from "../utils/bounds/types/options";

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

export type BoundsMatchParams = Pick<BoundsOptions, "id" | "group">;
export type BoundsMatchStyleOptions = Omit<BoundsOptions, "id" | "group">;

export type BoundsMatchAccessor = {
	style: <T extends BoundsMatchStyleOptions = BoundsMatchStyleOptions>(
		options?: T,
	) => BoundsOptionsResult<T & BoundsOptions>;
};

export type BoundsAccessor = {
	<T extends BoundsOptions>(options: T): BoundsOptionsResult<T>;
	match: (params: BoundsMatchParams) => BoundsMatchAccessor;
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
