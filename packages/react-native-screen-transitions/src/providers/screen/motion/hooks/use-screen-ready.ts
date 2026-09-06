import { useDerivedValue } from "react-native-reanimated";
import { isScreenReady } from "../helpers/transition-visual-state";
import type { MotionValues } from "../types";
import { LifecycleTransitionRequestKind } from "./use-transition-values";

export const useScreenReady = (motion: MotionValues) => {
	const {
		animationProgress: currentAnimationProgress,
		pendingLifecycleRequestKind: currentPendingLifecycleRequestKind,
		pendingLifecycleStartBlockCount: currentPendingLifecycleStartBlockCount,
	} = motion;

	const screenReady = useDerivedValue<number>(() => {
		"worklet";
		const isPendingOpen =
			currentPendingLifecycleRequestKind.get() ===
			LifecycleTransitionRequestKind.Open;
		const opening = isPendingOpen || !!motion.entering.get();

		return isScreenReady({
			opening,
			closing: motion.closing.get(),
			pendingLifecycleStartBlockCount:
				currentPendingLifecycleStartBlockCount.get(),
			animationProgress: currentAnimationProgress.get(),
		})
			? 1
			: 0;
	});

	return screenReady;
};
