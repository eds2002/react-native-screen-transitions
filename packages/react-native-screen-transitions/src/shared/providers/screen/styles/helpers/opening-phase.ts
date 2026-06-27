/**
 * The "pre-start" window of an opening transition: the screen has committed to
 * opening (`entering`) but `transitionProgress` has not yet moved past 0, so no
 * transformed frame has been produced yet.
 *
 * This window is a quarantine, and two source-level guards key off it:
 * - the visibility gate keeps the entering screen hidden (it must not be SEEN), and
 * - interpolator ownership stays on "current" so the entering screen does not
 *   DRIVE other screens' styles until its transition is actually live.
 *
 * Both must agree on when the open transition has started, so the threshold
 * lives here in one place rather than being re-derived at each site.
 */
export const hasOpenTransitionStarted = (transitionProgress: number) => {
	"worklet";
	return transitionProgress > 0;
};

export const isOpeningBeforeStart = (
	entering: number,
	transitionProgress: number,
) => {
	"worklet";
	return !!entering && !hasOpenTransitionStarted(transitionProgress);
};
