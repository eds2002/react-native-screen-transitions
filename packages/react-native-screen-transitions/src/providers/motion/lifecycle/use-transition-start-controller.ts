import { useAnimatedReaction } from "react-native-reanimated";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import type { BaseDescriptor } from "../../builder";
import {
	LifecycleTransitionRequestKind,
	type MotionTransitionValues,
} from "../hooks/use-transition-values";
import { useMotionStore } from "../motion.store";
import type { MotionAnimationValues } from "../types";

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
