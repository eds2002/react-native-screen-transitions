/**
 * Visual lifecycle boundaries use the internal directional clock rather than
 * physical transition progress, which may overshoot or revisit an endpoint.
 */
export const hasOpenTransitionStarted = (animationProgress: number) => {
	"worklet";
	return animationProgress > 0;
};

export const isOpenTransitionBlocked = ({
	opening,
	pendingLifecycleStartBlockCount,
	animationProgress,
}: {
	opening: boolean;
	pendingLifecycleStartBlockCount: number;
	animationProgress: number;
}) => {
	"worklet";
	return (
		opening &&
		(pendingLifecycleStartBlockCount > 0 ||
			!hasOpenTransitionStarted(animationProgress))
	);
};

export const isTransitionVisuallyClosed = ({
	closing,
	animationProgress,
	targetProgress,
}: {
	closing: number;
	animationProgress: number;
	targetProgress: number;
}) => {
	"worklet";
	return !!closing && targetProgress <= 0 && animationProgress <= 0;
};
