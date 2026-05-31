import type { TransitionSpec } from "../../../../types/animation.types";
import { resolveSnapTransitionSpec } from "../../../../utils/animation/resolve-snap-transition-spec";

export const getProgressVelocityTowardTarget = ({
	handoffVelocity,
	target,
	currentProgress,
}: {
	handoffVelocity: number;
	target: number;
	currentProgress: number;
}) => {
	"worklet";
	const progressDirection = Math.sign(target - currentProgress);

	if (progressDirection === 0) {
		return 0;
	}

	return progressDirection * Math.abs(handoffVelocity);
};

export const resolveGestureSnapTransitionSpec = ({
	transitionSpec,
	shouldDismiss,
	target,
	currentProgress,
}: {
	transitionSpec: TransitionSpec | undefined;
	shouldDismiss: boolean;
	target: number;
	currentProgress: number;
}) => {
	"worklet";
	if (shouldDismiss) {
		return transitionSpec;
	}

	return resolveSnapTransitionSpec(
		transitionSpec,
		target < currentProgress ? "collapse" : "expand",
	);
};
