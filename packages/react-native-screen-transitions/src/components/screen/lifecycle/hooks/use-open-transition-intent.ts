import { useLayoutEffect } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AnimationProgress } from "../../../../constants";
import useStableCallback from "../../../../hooks/use-stable-callback";
import {
	type BaseDescriptor,
	useBuilderStore,
} from "../../../../providers/screen/builder";
import {
	LifecycleTransitionRequestKind,
	type MotionTransitionValues,
} from "../../../../providers/screen/motion/hooks/use-transition-values";
import type { MotionAnimationValues } from "../../../../providers/screen/motion/types";
import type { SnapPoint } from "../../../../types/screen.types";

/**
 * Calculates the initial progress value based on snap points configuration.
 * Returns `'auto'` if the initial snap point is the `'auto'` keyword
 * (meaning the animation must be deferred until content is measured).
 */
function getInitialProgress({
	snapPoints,
	initialSnapIndex,
}: {
	snapPoints?: SnapPoint[];
	initialSnapIndex: number;
}): SnapPoint | undefined {
	if (!snapPoints) {
		return undefined;
	}

	const clampedIndex = Math.min(
		Math.max(0, initialSnapIndex),
		snapPoints.length - 1,
	);
	return snapPoints[clampedIndex];
}

/**
 * Handles opening transition intent on mount.
 */
export function useOpenTransitionIntent(
	current: BaseDescriptor,
	animations: MotionAnimationValues,
	system: MotionTransitionValues,
	onComplete?: () => void,
) {
	const isFirstKey = useBuilderStore((store) => store.derivations.isFirstKey);
	const { requestLifecycleTransition } = system.actions;
	const completeOpen = useStableCallback(() => {
		onComplete?.();
	});
	const { animationProgress } = system;
	const { closing } = animations;

	useAnimatedReaction(
		() => {
			"worklet";
			return (
				!closing.get() && animationProgress.get() === AnimationProgress.Visible
			);
		},
		(complete, previouslyComplete) => {
			"worklet";
			if (complete && !previouslyComplete) {
				scheduleOnRN(completeOpen);
			}
		},
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useLayoutEffect(() => {
		const {
			snapPoints,
			initialSnapIndex = 0,
			experimental_animateOnInitialMount,
		} = current.options;

		const initialProgress = getInitialProgress({
			snapPoints,
			initialSnapIndex,
		});

		if (isFirstKey && !experimental_animateOnInitialMount) {
			if (typeof initialProgress === "string") {
				system.targetProgress.set(0);
				animations.transitionProgress.set(0);
			} else {
				const target = initialProgress ?? AnimationProgress.Visible;
				system.targetProgress.set(target);
				animations.transitionProgress.set(target);
			}
			animations.progressAnimating.set(0);
			animations.closing.set(0);
			animations.entering.set(0);
			return;
		}

		// When the initial snap point is 'auto', defer the opening animation until
		// ScreenContainer has measured the content and set resolvedAutoSnapPoint.
		if (typeof initialProgress === "string") {
			return;
		}

		animations.entering.set(1);
		requestLifecycleTransition(
			LifecycleTransitionRequestKind.Open,
			initialProgress ?? AnimationProgress.Visible,
		);
	}, []);
}
