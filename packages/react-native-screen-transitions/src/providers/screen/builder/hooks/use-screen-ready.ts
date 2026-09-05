import { useDerivedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { isScreenReady } from "../../orchestrator/styles/helpers/transition-visual-state";
import {
	type BuilderAnimationState,
	LifecycleTransitionRequestKind,
} from "./use-builder-animation-state";

export const useScreenReady = (
	currentScreenKey: string,
	hasCurrentInterpolator: boolean,
	animationState: BuilderAnimationState,
) => {
	const { closing: currentClosing, entering: currentEntering } =
		AnimationStore.getBag(currentScreenKey);

	const {
		animationProgress: currentAnimationProgress,
		pendingLifecycleRequestKind: currentPendingLifecycleRequestKind,
		pendingLifecycleStartBlockCount: currentPendingLifecycleStartBlockCount,
	} = animationState;

	const screenReady = useDerivedValue<number>(() => {
		"worklet";
		const isPendingOpen =
			currentPendingLifecycleRequestKind.get() ===
			LifecycleTransitionRequestKind.Open;
		const opening = isPendingOpen || !!currentEntering.get();

		return isScreenReady({
			hasInterpolator: hasCurrentInterpolator,
			opening,
			closing: currentClosing.get(),
			pendingLifecycleStartBlockCount:
				currentPendingLifecycleStartBlockCount.get(),
			animationProgress: currentAnimationProgress.get(),
		})
			? 1
			: 0;
	});

	return screenReady;
};
