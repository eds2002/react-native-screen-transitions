import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AnimationProgress } from "../../../../constants";

export const useCloseCompletion = ({
	closing,
	animationProgress,
	onComplete,
}: {
	closing: SharedValue<number>;
	animationProgress: SharedValue<number>;
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
