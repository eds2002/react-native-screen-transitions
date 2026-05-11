import type { SharedValue } from "react-native-reanimated";
import type { ScreenTransitionTarget } from "../../../types/animation.types";
import type { BoundsAccessor } from "../../../types/bounds.types";
import type { ScreenInterpolatorFrame } from "./helpers/pipeline";

export type ScreenInterpolatorFrameUpdater = Pick<SharedValue<number>, "get">;

export type ScreenAnimationLegacyTarget =
	| "self"
	| "parent"
	| "root"
	| { ancestor: number };

export type ScreenAnimationTarget =
	| ScreenTransitionTarget
	| ScreenAnimationLegacyTarget;

export type ScreenAnimationSource = {
	screenInterpolatorProps: SharedValue<ScreenInterpolatorFrame>;
	screenInterpolatorFrameUpdater: ScreenInterpolatorFrameUpdater;
};

export type ScreenAnimationTransitionSource = ScreenAnimationSource & {
	boundsAccessor: BoundsAccessor;
};

export type ScreenAnimationDescendantSource = {
	source: ScreenAnimationTransitionSource;
	depth: number;
};

export type ScreenAnimationDescendantSources = SharedValue<
	ScreenAnimationDescendantSource[]
>;

export type RegisterScreenAnimationDescendant = (
	source: ScreenAnimationTransitionSource,
	depth: number,
) => () => void;

export type ScreenAnimationAncestorDescendantRegistrar = {
	register: RegisterScreenAnimationDescendant;
	depth: number;
};
