import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../types/animation.types";
import { useNavigationRoute } from "../../navigation/navigation-host.provider";
import { useOptionalScreenAnimationStore } from "./animation.provider";
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
	const routeKey = useNavigationRoute().key;
	const localAnimationStore = useOptionalScreenAnimationStore();
	const keyedAnimationStore = useOptionalScreenAnimationStore(
		localAnimationStore ? null : routeKey,
	);
	const screenAnimationStore = localAnimationStore ?? keyedAnimationStore;

	if (!screenAnimationStore) {
		throw new Error(
			`ScreenAnimationStore is unavailable for route "${routeKey}"`,
		);
	}

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
