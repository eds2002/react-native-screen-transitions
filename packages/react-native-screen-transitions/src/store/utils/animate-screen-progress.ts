import { runOnJS } from "react-native-reanimated";
import { ScreenProgressStore } from "@/store/screen-progress";
import type { ScreenState } from "@/types";
import { animate } from "@/utils";

export const animateScreenProgress = (screen: ScreenState) => {
	"worklet";
	const { id, closing, status, transitionSpec, onAnimationFinish } = screen;

	const animating = ScreenProgressStore.getAnimatingStatus(id);
	const progressValue = ScreenProgressStore.getScreenProgress(id);

	if (!progressValue && __DEV__) {
		console.warn(`Animation values not found for screen: ${id}`);
		return;
	}

	const animationConfig = closing
		? transitionSpec?.close
		: transitionSpec?.open;

	const targetValue = status || 0;

	animating.value = 1;

	// Helps avoid delays when no animation config is provided
	if (!animationConfig) {
		progressValue.value = targetValue;
		animating.value = 0;
		return;
	}

	progressValue.value = animate(targetValue, animationConfig, (finished) => {
		"worklet";
		if (finished && onAnimationFinish) {
			runOnJS(onAnimationFinish)(true);
		}
		animating.value = 0;
	});
};
