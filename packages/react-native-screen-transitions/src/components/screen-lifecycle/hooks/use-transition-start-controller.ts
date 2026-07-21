import { useAnimatedReaction } from "react-native-reanimated";
import type { BaseDescriptor } from "../../../providers/screen/descriptors";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	type SystemStoreMap,
} from "../../../stores/system.store";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";

export const useTransitionStartController = ({
	current,
	animations,
	system,
	onBlankStackCloseFinish,
	onNativeCloseFinish,
}: {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	system: SystemStoreMap;
	onBlankStackCloseFinish?: (finished: boolean) => void;
	onNativeCloseFinish?: (finished: boolean) => void;
}) => {
	const {
		targetProgress,
		pendingLifecycleRequestKind,
		pendingLifecycleRequestTarget,
		pendingLifecycleStartBlockCount,
	} = system;
	const { clearLifecycleTransitionRequest } = system.actions;
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

			const onAnimationFinish =
				kind === LifecycleTransitionRequestKind.BlankStackClose
					? onBlankStackCloseFinish
					: kind === LifecycleTransitionRequestKind.NativeClose
						? onNativeCloseFinish
						: undefined;

			animateToProgress({
				target,
				spec: transitionSpec,
				animations,
				targetProgress,
				onAnimationFinish,
			});

			clearLifecycleTransitionRequest();
		},
	);
};
