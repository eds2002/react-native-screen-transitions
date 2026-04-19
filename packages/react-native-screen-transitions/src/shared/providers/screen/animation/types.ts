import type { SharedValue } from "react-native-reanimated";
import type { BoundsAccessor } from "../../../types/bounds.types";
import type { ScreenInterpolatorFrame } from "./helpers/pipeline";

export type ScreenAnimationTarget =
	| "self"
	| "parent"
	| "root"
	| { ancestor: number };

export type ScreenAnimationSource = {
	screenInterpolatorProps: SharedValue<ScreenInterpolatorFrame>;
	boundsAccessor: BoundsAccessor;
};
