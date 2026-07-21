import { DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT } from "../../../../constants";
import type { GestureDirections } from "../../../../types/gesture.types";
import { shouldDismissFromProjection } from "./physics";
import { sanitizeSnapPoints } from "./snap-points";

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

const isMovingTowardDismiss = (
	positiveDirectionEnabled: boolean,
	negativeDirectionEnabled: boolean,
	translation: number,
) => {
	"worklet";
	return (
		(positiveDirectionEnabled && translation > 0) ||
		(negativeDirectionEnabled && translation < 0)
	);
};

const shouldDismissAlongAxis = ({
	positiveDirectionEnabled,
	negativeDirectionEnabled,
	translation,
	velocity,
	dimension,
	gestureVelocityImpact,
}: {
	positiveDirectionEnabled: boolean;
	negativeDirectionEnabled: boolean;
	translation: number;
	velocity: number;
	dimension: number;
	gestureVelocityImpact: number;
}) => {
	"worklet";
	return (
		isMovingTowardDismiss(
			positiveDirectionEnabled,
			negativeDirectionEnabled,
			translation,
		) &&
		shouldDismissFromProjection(
			translation,
			velocity,
			dimension,
			gestureVelocityImpact,
		)
	);
};

export const determineDismissal = ({
	event,
	directions,
	dimensions,
	gestureVelocityImpact,
}: DetermineDismissalProps) => {
	"worklet";

	const verticalDismiss = shouldDismissAlongAxis({
		positiveDirectionEnabled: directions.vertical,
		negativeDirectionEnabled: directions.verticalInverted,
		translation: event.translationY,
		velocity: event.velocityY,
		dimension: dimensions.height,
		gestureVelocityImpact,
	});
	const horizontalDismiss = shouldDismissAlongAxis({
		positiveDirectionEnabled: directions.horizontal,
		negativeDirectionEnabled: directions.horizontalInverted,
		translation: event.translationX,
		velocity: event.velocityX,
		dimension: dimensions.width,
		gestureVelocityImpact,
	});

	return { shouldDismiss: verticalDismiss || horizontalDismiss };
};

const buildSnapTargetList = (snapPoints: number[], canDismiss: boolean) => {
	"worklet";
	const sanitizedSnapPoints = sanitizeSnapPoints(snapPoints, canDismiss);
	const targets = canDismiss
		? [0, ...sanitizedSnapPoints]
		: sanitizedSnapPoints;

	return Array.from(new Set(targets)).sort((a, b) => a - b);
};

const projectSnapProgress = (
	currentProgress: number,
	velocity: number,
	dimension: number,
	velocityFactor: number,
) => {
	"worklet";
	// Convert velocity to progress units (positive = toward dismiss = decreasing progress)
	const velocityInProgress = (velocity / dimension) * velocityFactor;
	return currentProgress - velocityInProgress;
};

const findTargetForProjectedProgress = (
	projectedProgress: number,
	targets: number[],
) => {
	"worklet";
	let targetProgress = targets[0];

	for (let i = 0; i < targets.length; i++) {
		const current = targets[i];
		const next = targets[i + 1];

		if (next === undefined) {
			return current;
		}

		const midpoint = (current + next) / 2;

		if (projectedProgress < midpoint) {
			return current;
		}

		targetProgress = next;
	}

	return targetProgress;
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
	velocityFactor,
	canDismiss,
}: DetermineSnapTargetProps): DetermineSnapTargetResult {
	"worklet";
	const resolvedVelocityFactor =
		velocityFactor ?? DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT;
	const resolvedCanDismiss = canDismiss ?? true;
	const allTargets = buildSnapTargetList(snapPoints, resolvedCanDismiss);

	if (allTargets.length === 0) {
		return {
			targetProgress: currentProgress,
			shouldDismiss: false,
		};
	}

	const targetProgress = findTargetForProjectedProgress(
		projectSnapProgress(
			currentProgress,
			velocity,
			dimension,
			resolvedVelocityFactor,
		),
		allTargets,
	);

	return {
		targetProgress,
		shouldDismiss: resolvedCanDismiss && targetProgress === 0,
	};
}
