import { runOnJS } from "react-native-reanimated";
import type { AnimationMap } from "../../stores/animations";
import type { TransitionSpec } from "../../types/animation";
import { animate } from "./animate";

interface StartScreenTransitionProps {
	target: "open" | "close";
	spec?: TransitionSpec;
	onAnimationFinish?: (finished: boolean) => void;
	animations: AnimationMap;
}

export const startScreenTransition = ({
	target,
	spec,
	onAnimationFinish,
	animations,
}: StartScreenTransitionProps) => {
	"worklet";
	const value = target === "open" ? 1 : 0;
	const config = target === "open" ? spec?.open : spec?.close;

	const { progress, animating, closing } = animations;

	if (target === "close") {
		closing.value = 1;
	}

	if (!config) {
		animating.value = 0;
		progress.value = value;

		if (onAnimationFinish) {
			runOnJS(onAnimationFinish)(true);
		}
		return;
	}

	animating.value = 1;

	progress.value = animate(value, config, (finished) => {
		"worklet";
		if (finished) {
			if (onAnimationFinish) {
				runOnJS(onAnimationFinish)(finished);
			}
			animating.value = 0;
		}
	});
};
