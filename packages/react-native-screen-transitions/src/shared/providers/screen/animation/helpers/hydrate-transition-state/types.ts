import type { SharedValue } from "react-native-reanimated";
import type { GestureStoreMap } from "../../../../../stores/gesture.store";
import type {
	ScreenTransitionOptions,
	ScreenTransitionState,
} from "../../../../../types/animation.types";
import type { ScrollMetadataState } from "../../../../../types/gesture.types";
import type { Layout } from "../../../../../types/screen.types";
import type { BaseStackRoute } from "../../../../../types/stack.types";

export type BuiltState = {
	transitionProgress: SharedValue<number>;
	visualProgress: SharedValue<number>;
	willAnimate: SharedValue<number>;
	closing: SharedValue<number>;
	progressAnimating: SharedValue<number>;
	progressSettled: SharedValue<number>;
	entering: SharedValue<number>;
	gesture: GestureStoreMap;
	route: BaseStackRoute;
	meta?: Record<string, unknown>;
	options: ScreenTransitionOptions;
	optionsSlot: ScreenTransitionOptions;
	targetProgress: SharedValue<number>;
	resolvedAutoSnapPoint: SharedValue<number>;
	measuredContentLayout: SharedValue<Layout | null>;
	scrollMetadata: SharedValue<ScrollMetadataState | null>;
	contentLayoutSlot: Layout;
	hasAutoSnapPoint: boolean;
	sortedNumericSnapPoints: number[];
	unwrapped: ScreenTransitionState;
};

export type SnapBounds = {
	min: number;
	max: number;
};
