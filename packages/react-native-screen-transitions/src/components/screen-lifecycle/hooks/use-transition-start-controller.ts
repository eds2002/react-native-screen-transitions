import { useAnimatedReaction } from "react-native-reanimated";
import type { BaseDescriptor } from "../../../providers/screen/descriptors";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import {
	LifecycleTransitionRequestKind,
	type SystemStoreMap,
} from "../../../stores/system.store";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";

export const useTransitionStartController = ({
	current,
	animations,
	system,
}: {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	system: SystemStoreMap;
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
	const isDragging = GestureStore.getValue(current.route.key, "dragging");

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
