import { runOnJS } from "react-native-reanimated";
import type { AnimationMap } from "../../stores/animations";
import type { TransitionSpec } from "../../types/animation";
import { animate } from "./animate";

interface RunTransitionProps {
	target: "open" | "close";
	spec?: TransitionSpec;
	onFinish?: (finished: boolean) => void;
	animations: AnimationMap;
}

export const runTransition = ({
	target,
	spec,
	onFinish,
	animations,
}: RunTransitionProps) => {
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

		if (onFinish) {
			runOnJS(onFinish)(true);
		}
		return;
	}

	animating.value = 1;
	progress.value = animate(value, config, (finished) => {
		"worklet";
		if (finished) {
			animating.value = 0;
			if (onFinish) {
				runOnJS(onFinish)(finished);
			}
		}
	});
};
