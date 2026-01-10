interface DetermineSnapTargetProps {
	currentProgress: number;
	snapPoints: number[];
	velocityY: number;
	screenHeight: number;
	/** How much velocity affects the snap decision (0-1). Default 0.15 */
	velocityFactor?: number;
}

interface DetermineSnapTargetResult {
	targetProgress: number;
	shouldDismiss: boolean;
}

/**
 * Determines which snap point to animate to based on current progress and velocity.
 *
 * Logic: Snap to whichever point is closest, factoring in velocity.
 * The "zones" between snap points are split at midpoints.
 * Velocity can push you into the next zone.
 */
export function determineSnapTarget({
	currentProgress,
	snapPoints,
	velocityY,
	screenHeight,
	velocityFactor = 0.15,
}: DetermineSnapTargetProps): DetermineSnapTargetResult {
	"worklet";

	// Convert velocity to progress units (positive = dragging down = decreasing progress)
	const velocityInProgress = (velocityY / screenHeight) * velocityFactor;

	// Project where we'd end up with velocity
	const projectedProgress = currentProgress - velocityInProgress;

	// Build all possible targets: dismiss (0) + all snap points
	const allTargets = [0, ...snapPoints].sort((a, b) => a - b);

	// Find the target whose zone contains the projected progress
	// Zones are split at midpoints between adjacent targets
	let targetProgress = allTargets[0];

	for (let i = 0; i < allTargets.length; i++) {
		const current = allTargets[i];
		const next = allTargets[i + 1];

		if (next === undefined) {
			// Last target - if we're above the midpoint to here, snap to it
			targetProgress = current;
			break;
		}

		const midpoint = (current + next) / 2;

		if (projectedProgress < midpoint) {
			targetProgress = current;
			break;
		}

		targetProgress = next;
	}

	return {
		targetProgress,
		shouldDismiss: targetProgress === 0,
	};
}
