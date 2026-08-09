/**
 * Visual lifecycle boundaries use the internal directional clock rather than
 * physical transition progress, which may overshoot or revisit an endpoint.
 */
export const hasOpenTransitionStarted = ({
	pendingLifecycleStartBlockCount,
	animationProgress,
}: {
	pendingLifecycleStartBlockCount: number;
	animationProgress: number;
}) => {
	"worklet";
	return pendingLifecycleStartBlockCount === 0 && animationProgress > 0;
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
		!hasOpenTransitionStarted({
			pendingLifecycleStartBlockCount,
			animationProgress,
		})
	);
};

export const hasCloseTransitionFinished = ({
	closing,
	animationProgress,
}: {
	closing: number;
	animationProgress: number;
}) => {
	"worklet";
	return !!closing && animationProgress === 0;
};

export const isScreenInterpolatorReady = ({
	hasInterpolator,
	opening,
	closing,
	pendingLifecycleStartBlockCount,
	animationProgress,
}: {
	hasInterpolator: boolean;
	opening: boolean;
	closing: number;
	pendingLifecycleStartBlockCount: number;
	animationProgress: number;
}) => {
	"worklet";

	return (
		hasInterpolator &&
		!isOpenTransitionBlocked({
			opening,
			pendingLifecycleStartBlockCount,
			animationProgress,
		}) &&
		!hasCloseTransitionFinished({ closing, animationProgress })
	);
};
