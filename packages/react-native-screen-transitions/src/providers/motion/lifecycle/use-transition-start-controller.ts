import { useAnimatedReaction } from "react-native-reanimated";
import type { BaseDescriptor } from "../../builder";
import { animateToProgress } from "../animation/animate-to-progress";
import { LifecycleTransitionRequestKind } from "../hooks/use-transition-values";
import type { MotionValues } from "../types";

export const useTransitionStartController = ({
	current,
	values,
}: {
	current: BaseDescriptor;
	values: MotionValues;
}) => {
	const {
		pendingLifecycleRequestKind,
		pendingLifecycleRequestTarget,
		pendingLifecycleStartBlockCount,
	} = values;
	const { clearLifecycleTransitionRequest } = values.actions;
	const transitionSpec = current.options.transitionSpec;

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
					!values.entering.get(),
				values,
				isDragging: values.dragging,
			});

			clearLifecycleTransitionRequest();
		},
	);
};
