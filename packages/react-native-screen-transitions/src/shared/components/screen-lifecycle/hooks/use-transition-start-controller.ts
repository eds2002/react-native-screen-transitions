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
	onManagedCloseFinish,
	onNativeCloseFinish,
}: {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	system: SystemStoreMap;
	onManagedCloseFinish?: (finished: boolean) => void;
	onNativeCloseFinish?: (finished: boolean) => void;
}) => {
	const {
		targetProgress,
		pendingLifecycleRequestId,
		pendingLifecycleRequestKind,
		pendingLifecycleRequestTarget,
		clearLifecycleTransitionRequest,
	} = system;

	useAnimatedReaction(
		() => {
			"worklet";
			return [
				pendingLifecycleRequestId.get(),
				pendingLifecycleRequestKind.get(),
				pendingLifecycleRequestTarget.get(),
			] as const;
		},
		(next, previous) => {
			"worklet";
			const [requestId, kind, target] = next;

			if (kind === LifecycleTransitionRequestKind.None || requestId === 0) {
				return;
			}

			if (previous && requestId === previous[0]) {
				return;
			}

			const onAnimationFinish =
				kind === LifecycleTransitionRequestKind.ManagedClose
					? onManagedCloseFinish
					: kind === LifecycleTransitionRequestKind.NativeClose
						? onNativeCloseFinish
						: undefined;

			animateToProgress({
				target,
				spec: current.options.transitionSpec,
				animations,
				targetProgress,
				onAnimationFinish,
			});

			clearLifecycleTransitionRequest(requestId);
		},
	);
};
