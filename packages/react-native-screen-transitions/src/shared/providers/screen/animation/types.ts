import type { SharedValue } from "react-native-reanimated";
import type { BoundsAccessor } from "../../../types/bounds.types";
import type { ChainTarget } from "../../../utils/resolve-chain-target";
import type { ScreenInterpolatorFrame } from "./helpers/pipeline";

export type ScreenAnimationTarget = ChainTarget;

export type ScreenAnimationSource = {
	screenInterpolatorProps: SharedValue<ScreenInterpolatorFrame>;
	boundsAccessor: BoundsAccessor;
};
