import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AnimationProgress } from "../../../constants";
import type { MotionValues } from "../types";

export const useCloseCompletion = ({
	values: { closing, animationProgress },
	onComplete,
}: {
	values: Pick<MotionValues, "closing" | "animationProgress">;
	onComplete: () => void;
}) => {
	useAnimatedReaction(
		() => {
			"worklet";
			return (
				!!closing.get() && animationProgress.get() <= AnimationProgress.Hidden
			);
		},
		(complete, previouslyComplete) => {
			"worklet";
			if (complete && !previouslyComplete) {
				scheduleOnRN(onComplete);
			}
		},
	);
};
