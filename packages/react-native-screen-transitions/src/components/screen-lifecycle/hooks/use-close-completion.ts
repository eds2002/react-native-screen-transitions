import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

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
			return !!closing.get() && animationProgress.get() <= 0;
		},
		(complete, previouslyComplete) => {
			"worklet";
			if (complete && !previouslyComplete) {
				scheduleOnRN(onComplete);
			}
		},
	);
};
