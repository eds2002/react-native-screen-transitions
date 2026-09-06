import { useDerivedValue } from "react-native-reanimated";
import { useOptionalMotionStore } from "../../motion";
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
	const motion = useOptionalMotionStore(
		currentScreenKey,
		(store) => store.state,
	);

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
		const opening = isPendingOpen || !!(motion?.entering.get() ?? 0);

		return isScreenReady({
			hasInterpolator: hasCurrentInterpolator,
			opening,
			closing: motion?.closing.get() ?? 0,
			pendingLifecycleStartBlockCount:
				currentPendingLifecycleStartBlockCount.get(),
			animationProgress: currentAnimationProgress.get(),
		})
			? 1
			: 0;
	});

	return screenReady;
};
