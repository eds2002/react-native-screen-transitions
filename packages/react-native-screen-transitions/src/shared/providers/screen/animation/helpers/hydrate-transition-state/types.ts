import type { SharedValue } from "react-native-reanimated";
import type { GestureStoreMap } from "../../../../../stores/gesture.store";
import type {
	ScreenTransitionOptions,
	ScreenTransitionState,
} from "../../../../../types/animation.types";
import type { Layout } from "../../../../../types/screen.types";
import type { BaseStackRoute } from "../../../../../types/stack.types";

export type BuiltState = {
	progress: SharedValue<number>;
	willAnimate: SharedValue<number>;
	closing: SharedValue<number>;
	progressAnimating: SharedValue<number>;
	entering: SharedValue<number>;
	gesture: GestureStoreMap;
	route: BaseStackRoute;
	meta?: Record<string, unknown>;
	options: ScreenTransitionOptions;
	navigationMaskEnabled: boolean;
	targetProgress: SharedValue<number>;
	logicalSettleFrameCount: SharedValue<number>;
	resolvedAutoSnapPoint: SharedValue<number>;
	measuredContentLayout: SharedValue<Layout | null>;
	contentLayoutSlot: Layout;
	hasAutoSnapPoint: boolean;
	sortedNumericSnapPoints: number[];
	unwrapped: ScreenTransitionState;
};

export type ComputeLogicallySettledParams = {
	progress: number;
	targetProgress: number;
	frameCount: number;
};

export type SnapBounds = {
	min: number;
	max: number;
};
