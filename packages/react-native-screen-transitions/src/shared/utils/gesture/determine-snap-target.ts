interface DetermineSnapTargetProps {
	currentProgress: number;
	snapPoints: number[];
	/** Velocity along the snap axis (positive = toward dismiss) */
	velocity: number;
	/** Screen dimension along the snap axis (width or height) */
	dimension: number;
	/**
	 * How much velocity affects the snap decision.
	 * Lower values = more deliberate/iOS-like, higher values = more responsive to flicks.
	 * @default 0.1
	 */
	velocityFactor?: number;
	/** Whether dismiss (progress=0) is allowed. Default true */
	canDismiss?: boolean;
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
	velocity,
	dimension,
	velocityFactor = 0.1,
	canDismiss = true,
}: DetermineSnapTargetProps): DetermineSnapTargetResult {
	"worklet";

	// Convert velocity to progress units (positive = toward dismiss = decreasing progress)
	const velocityInProgress = (velocity / dimension) * velocityFactor;

	// Project where we'd end up with velocity
	const projectedProgress = currentProgress - velocityInProgress;

	const sanitizedSnapPoints = snapPoints.filter((point) =>
		canDismiss ? Number.isFinite(point) : Number.isFinite(point) && point > 0,
	);

	// Build all possible targets: dismiss (0) only if allowed, plus all snap points
	const allTargets = Array.from(
		new Set(canDismiss ? [0, ...sanitizedSnapPoints] : sanitizedSnapPoints),
	).sort((a, b) => a - b);

	if (allTargets.length === 0) {
		return {
			targetProgress: currentProgress,
			shouldDismiss: false,
		};
	}

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
		shouldDismiss: canDismiss && targetProgress === 0,
	};
}
