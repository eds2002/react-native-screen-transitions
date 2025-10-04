import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type {
	BoundsBuilderOptions,
	BoundsReturnType,
} from "../utils/bounds/_types/builder";
import type { ScreenPhase } from "./core";

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

export type BoundsAccessor = {
	<T extends BoundsBuilderOptions>(options: T): BoundsReturnType<T>;
	get: (id?: string, phase?: ScreenPhase) => BoundEntry;
};
