import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../types/animation.types";
import { useScreenAnimationStore } from "./animation.provider";
import { useBuildTransitionAccessor } from "./helpers/accessors/use-build-transition-accessor";
import { readScreenAnimationRevisions } from "./helpers/read-screen-animation-revisions";
import type { ScreenAnimationTarget } from "./types";

export type { ScreenAnimationTarget } from "./types";

export function useScreenAnimation(): DerivedValue<ScreenInterpolationProps>;
export function useScreenAnimation(target: {
	depth: 0;
}): DerivedValue<ScreenInterpolationProps>;
export function useScreenAnimation(
	target: ScreenTransitionTarget,
): DerivedValue<ScreenInterpolationProps | null>;
export function useScreenAnimation(
	target?: ScreenAnimationTarget,
):
	| DerivedValue<ScreenInterpolationProps>
	| DerivedValue<ScreenInterpolationProps | null> {
	const screenAnimationStore = useScreenAnimationStore();

	const { transitionSources } = screenAnimationStore;
	const transition = useBuildTransitionAccessor(screenAnimationStore);
	const transitionTarget = target;

	const animation = useDerivedValue<ScreenInterpolationProps | null>(() => {
		"worklet";
		readScreenAnimationRevisions(transitionSources);
		return transition(transitionTarget);
	});

	return animation;
}
