import type { GestureDirections } from "../../../../types/gesture.types";
import { sanitizeSnapPoints } from "../../../../utils/gesture/validate-snap-points";
import { shouldDismissFromTranslationAndVelocity } from "./gesture-physics";

interface GetAxisThresholdProps {
	translation: number;
	velocity: number;
	screenSize: number;
	gestureVelocityImpact: number;
}

interface DetermineDismissalProps {
	event: {
		translationX: number;
		translationY: number;
		velocityX: number;
		velocityY: number;
	};
	directions: GestureDirections;
	dimensions: { width: number; height: number };
	gestureVelocityImpact: number;
}

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

const getAxisThreshold = ({
	translation,
	velocity,
	screenSize,
	gestureVelocityImpact,
}: GetAxisThresholdProps) => {
	"worklet";
	return shouldDismissFromTranslationAndVelocity(
		translation,
		velocity,
		screenSize,
		gestureVelocityImpact,
	);
};

export const determineDismissal = ({
	event,
	directions,
	dimensions,
	gestureVelocityImpact,
}: DetermineDismissalProps) => {
	"worklet";

	let shouldDismiss: boolean = false;

	if (
		(directions.vertical && event.translationY > 0) ||
		(directions.verticalInverted && event.translationY < 0)
	) {
		const dismiss = getAxisThreshold({
			translation: event.translationY,
			velocity: event.velocityY,
			screenSize: dimensions.height,
			gestureVelocityImpact,
		});
		if (dismiss) shouldDismiss = true;
	}

	if (
		(directions.horizontal && event.translationX > 0) ||
		(directions.horizontalInverted && event.translationX < 0)
	) {
		const dismiss = getAxisThreshold({
			translation: event.translationX,
			velocity: event.velocityX,
			screenSize: dimensions.width,
			gestureVelocityImpact,
		});

		if (dismiss) shouldDismiss = true;
	}

	return { shouldDismiss };
};

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

	const sanitizedSnapPoints = sanitizeSnapPoints(snapPoints, canDismiss);

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
