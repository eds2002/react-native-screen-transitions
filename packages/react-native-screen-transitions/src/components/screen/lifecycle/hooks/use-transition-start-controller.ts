import { useAnimatedReaction } from "react-native-reanimated";
import type { BaseDescriptor } from "../../../../providers/screen/builder";
import { useMotionStore } from "../../../../providers/screen/motion";
import {
	LifecycleTransitionRequestKind,
	type MotionTransitionValues,
} from "../../../../providers/screen/motion/hooks/use-transition-values";
import type { MotionAnimationValues } from "../../../../providers/screen/motion/types";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";

export const useTransitionStartController = ({
	current,
	animations,
	system,
}: {
	current: BaseDescriptor;
	animations: MotionAnimationValues;
	system: MotionTransitionValues;
}) => {
	const {
		targetProgress,
		animationProgress,
		pendingLifecycleRequestKind,
		pendingLifecycleRequestTarget,
		pendingLifecycleStartBlockCount,
	} = system;
	const { clearLifecycleTransitionRequest } = system.actions;
	const transitionSpec = current.options.transitionSpec;
	const isDragging = useMotionStore((store) => store.state.dragging);

	useAnimatedReaction(
		() => {
			"worklet";
			return [
				pendingLifecycleRequestKind.get(),
				pendingLifecycleRequestTarget.get(),
				pendingLifecycleStartBlockCount.get(),
			] as const;
		},
		(next) => {
			"worklet";
			const [kind, target, blockCount] = next;

			if (kind === LifecycleTransitionRequestKind.None) {
				return;
			}

			if (blockCount > 0) {
				return;
			}

			animateToProgress({
				target,
				spec: transitionSpec,
				emitWillAnimate:
					kind !== LifecycleTransitionRequestKind.Open ||
					!animations.entering.get(),
				animations,
				targetProgress,
				animationProgress,
				isDragging,
			});

			clearLifecycleTransitionRequest();
		},
	);
};
