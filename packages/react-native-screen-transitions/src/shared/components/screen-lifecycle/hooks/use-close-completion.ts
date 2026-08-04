import {
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
} from "react-native-reanimated";

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
				runOnJS(onComplete)();
			}
		},
	);
};
