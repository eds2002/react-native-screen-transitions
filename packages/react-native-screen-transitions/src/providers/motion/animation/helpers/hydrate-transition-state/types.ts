import type { SharedValue } from "react-native-reanimated";
import type {
	ScreenTransitionOptions,
	ScreenTransitionState,
} from "../../../../../types/animation.types";
import type { ScrollMetadataState } from "../../../../../types/gesture.types";
import type { Layout } from "../../../../../types/screen.types";
import type { BaseStackRoute } from "../../../../../types/stack.types";
import type {
	MotionAnimationValues,
	MotionGestureValues,
	MotionValues,
} from "../../../types";

export type MotionAnimationState = MotionValues & {
	route: BaseStackRoute;
	meta?: Record<string, unknown>;
	options: ScreenTransitionOptions;
	targetProgress: SharedValue<number>;
	resolvedAutoSnapPoint: SharedValue<number>;
	measuredContentLayout: SharedValue<Layout | null>;
	scrollMetadata: SharedValue<ScrollMetadataState | null>;
	hasAutoSnapPoint: boolean;
	sortedNumericSnapPoints: number[];
};

// Each interpolator reader owns its mutable output and option overrides.
export type BuiltState = Pick<
	MotionAnimationState,
	| keyof MotionAnimationValues
	| "route"
	| "meta"
	| "options"
	| "targetProgress"
	| "resolvedAutoSnapPoint"
	| "measuredContentLayout"
	| "scrollMetadata"
	| "hasAutoSnapPoint"
	| "sortedNumericSnapPoints"
> & {
	gesture: Omit<MotionGestureValues, "internal"> & {
		internal: Pick<
			MotionGestureValues["internal"],
			"progressDeltaX" | "progressDeltaY" | "snapshot"
		>;
	};
	optionsSlot: ScreenTransitionOptions;
	contentLayoutSlot: Layout;
	unwrapped: ScreenTransitionState;
};

export type SnapBounds = {
	min: number;
	max: number;
};
