import { useAnimatedReaction } from "react-native-reanimated";
import { runOnUISync, scheduleOnRN } from "react-native-worklets";
import { AnimationProgress, IS_WEB } from "../../../../../constants";
import useStableCallback from "../../../../../hooks/use-stable-callback";
import type { MotionValues } from "../../../../../providers/motion/types";

export const useTransitionCompletion = ({
	motion,
	onClose,
	onOpen,
}: {
	motion: Pick<
		MotionValues,
		"progressRequest" | "closing" | "animationProgress" | "dragging"
	>;
	onClose: () => void;
	onOpen?: () => void;
}) => {
	const { progressRequest, closing, animationProgress, dragging } = motion;

	const getCompletedRequest = () => {
		"worklet";
		const request = progressRequest.get();
		if (request.phase !== "finished") return null;

		const isClosing = !!closing.get();
		if (isClosing && dragging.get()) return null;
		if (
			animationProgress.get() !==
			(isClosing ? AnimationProgress.Hidden : AnimationProgress.Visible)
		) {
			return null;
		}
		return { id: request.id, isClosing };
	};

	const completeOnRN = useStableCallback((id: number, isClosing: boolean) => {
		const consume = () => {
			"worklet";
			const request = getCompletedRequest();
			if (request?.id !== id || request.isClosing !== isClosing) return false;

			progressRequest.set({ id, phase: "idle" });
			return true;
		};
		const shouldComplete = IS_WEB ? consume() : runOnUISync(consume);
		if (!shouldComplete) return;
		if (isClosing) onClose();
		else onOpen?.();
	});

	useAnimatedReaction(getCompletedRequest, (request, previousRequest) => {
		"worklet";
		if (request && request.id !== previousRequest?.id) {
			scheduleOnRN(completeOnRN, request.id, request.isClosing);
		}
	});
};
