import type { SharedValue } from "react-native-reanimated";
import type { ScreenTransitionTarget } from "../../../types/animation.types";
import type { BoundsAccessor } from "../../../types/bounds.types";
import type { ScreenInterpolatorFrame } from "./helpers/pipeline";

export type ScreenInterpolatorPropsRevision = Pick<SharedValue<number>, "get">;

export type ScreenAnimationTarget = ScreenTransitionTarget;

export type ScreenAnimationTransitionSource = {
	screenInterpolatorProps: SharedValue<ScreenInterpolatorFrame>;
	screenInterpolatorPropsRevision: ScreenInterpolatorPropsRevision;
	boundsAccessor: BoundsAccessor;
};
