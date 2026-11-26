import { useAnimatedReaction } from "react-native-reanimated";
import {
	LifecycleTransitionRequestKind,
	type MotionTransitionValues,
} from "../../../../../providers/motion/hooks/use-transition-values";
import type { MotionAnimationValues } from "../../../../../providers/motion/types";

export function useOpenOnMeasurement(
	enabled: boolean,
	animations: MotionAnimationValues,
	system: MotionTransitionValues,
	open: (target: number) => void,
) {
	const { resolvedAutoSnapPoint, pendingLifecycleRequestKind } = system;
	const { transitionProgress, progressAnimating, entering, closing } =
		animations;

	useAnimatedReaction(
		() => {
			"worklet";
			return enabled ? resolvedAutoSnapPoint.get() : -1;
		},
		(target, previous) => {
			"worklet";
			if (
				target <= 0 ||
				(previous ?? 0) > 0 ||
				transitionProgress.get() !== 0 ||
				progressAnimating.get() ||
				entering.get() ||
				closing.get() ||
				pendingLifecycleRequestKind.get() !==
					LifecycleTransitionRequestKind.None
			) {
				return;
			}
			open(target);
		},
	);
}
