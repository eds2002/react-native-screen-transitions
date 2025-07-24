import { runOnJS } from "react-native-reanimated";
import type { ScreenState } from "@/types";
import { animate } from "@/utils";
import { ScreenProgressStore } from "../screen-progress";

export const animateScreenProgress = (screen: ScreenState) => {
	"worklet";
	const { id, closing, status, transitionSpec, onAnimationFinish } = screen;

	const progressValue = ScreenProgressStore.getMutable(id);

	if (!progressValue && __DEV__) {
		console.warn(`Animation values not found for screen: ${id}`);
		return;
	}

	const animationConfig = closing
		? transitionSpec?.close
		: transitionSpec?.open;

	const targetValue = status || 0;

	progressValue.value = animate(targetValue, animationConfig, (finished) => {
		"worklet";
		if (finished && onAnimationFinish) {
			runOnJS(onAnimationFinish)(true);
		}
	});
};
