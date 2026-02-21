import type {
	GestureStateChangeEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { clamp } from "react-native-reanimated";
import {
	ANIMATION_SNAP_THRESHOLD,
	DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
	EPSILON,
} from "../../../../constants";
import type { AnimationStoreMap } from "../../../../stores/animation.store";
import type { GestureDirections } from "../../../../types/gesture.types";

interface CalculateProgressProps {
	animations: AnimationStoreMap;
	shouldDismiss: boolean;
	event: GestureStateChangeEvent<PanGestureHandlerEventPayload>;
	dimensions: { width: number; height: number };
	directions: GestureDirections;
}

type GestureAxisCandidate = {
	progressContribution: number;
	velocityContribution: number;
};

/**
 * Converts velocity from pixels/second to normalized units/second (0-1 range)
 * and caps the result for stability
 */
export const normalizeVelocity = (
	velocityPixelsPerSecond: number,
	screenSize: number,
) => {
	"worklet";
	return clamp(
		velocityPixelsPerSecond / Math.max(1, screenSize),
		-DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
		DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
	);
};

/**
 * Normalizes translation to -1...1 range (for gesture tracking).
 * Used to convert pixel translation to normalized gesture values.
 */
export const normalizeGestureTranslation = (
	translation: number,
	dimension: number,
) => {
	"worklet";
	return clamp(translation / Math.max(1, dimension), -1, 1);
};

/**
 * Calculates a normalized velocity that moves the current value toward zero.
 * Used for spring-back animations when dismissing gestures.
 */
export const calculateRestoreVelocityTowardZero = (
	currentValueNormalized: number,
	baseVelocityNormalized: number,
) => {
	"worklet";

	if (Math.abs(currentValueNormalized) < ANIMATION_SNAP_THRESHOLD) return 0;

	const directionTowardZero = Math.sign(currentValueNormalized) || 1;
	const clampedVelocity = Math.min(Math.abs(baseVelocityNormalized), 1);

	return -directionTowardZero * clampedVelocity;
};

export const calculateProgressSpringVelocity = ({
	animations,
	shouldDismiss,
	event,
	dimensions,
	directions,
}: CalculateProgressProps) => {
	"worklet";

	const currentProgress = animations.progress.value;
	const targetProgress = shouldDismiss ? 0 : 1;
	const progressDelta = targetProgress - currentProgress;

	const progressDirection = progressDelta === 0 ? 0 : Math.sign(progressDelta);

	const candidates: GestureAxisCandidate[] = [];

	if (directions.horizontal && event.translationX > 0) {
		candidates.push({
			progressContribution: event.translationX / Math.max(1, dimensions.width),
			velocityContribution: normalizeVelocity(
				event.velocityX,
				dimensions.width,
			),
		});
	}

	if (directions.horizontalInverted && event.translationX < 0) {
		candidates.push({
			progressContribution: -event.translationX / Math.max(1, dimensions.width),
			velocityContribution: normalizeVelocity(
				-event.velocityX,
				dimensions.width,
			),
		});
	}

	if (directions.vertical && event.translationY > 0) {
		candidates.push({
			progressContribution: event.translationY / Math.max(1, dimensions.height),
			velocityContribution: normalizeVelocity(
				event.velocityY,
				dimensions.height,
			),
		});
	}

	if (directions.verticalInverted && event.translationY < 0) {
		candidates.push({
			progressContribution:
				-event.translationY / Math.max(1, dimensions.height),
			velocityContribution: normalizeVelocity(
				-event.velocityY,
				dimensions.height,
			),
		});
	}

	let progressVelocityMagnitude = 0;

	if (candidates.length > 0) {
		let dominant = candidates[0];
		for (let i = 1; i < candidates.length; i++) {
			const candidate = candidates[i];
			if (candidate.progressContribution > dominant.progressContribution) {
				dominant = candidate;
			}
		}
		progressVelocityMagnitude = Math.abs(dominant.velocityContribution);
	} else {
		const normalizedVelocityX = normalizeVelocity(
			event.velocityX,
			dimensions.width,
		);
		const normalizedVelocityY = normalizeVelocity(
			event.velocityY,
			dimensions.height,
		);
		progressVelocityMagnitude = Math.max(
			Math.abs(normalizedVelocityX),
			Math.abs(normalizedVelocityY),
		);
	}

	// Apply direction and clamp to prevent overly energetic springs
	return (
		progressDirection *
		clamp(progressVelocityMagnitude, 0, DEFAULT_GESTURE_RELEASE_VELOCITY_MAX)
	);
};

/**
 * Determines if a gesture should trigger dismissal based on combined
 * translation and velocity in normalized screen units (0-1 range).
 *
 * Formula: |translation/screen + clamp(velocity/screen, ±1) * velocityWeight| > 0.5
 */
export const shouldDismissFromTranslationAndVelocity = (
	translationPixels: number,
	velocityPixelsPerSecond: number,
	screenSize: number,
	velocityWeight: number,
) => {
	"worklet";

	const normalizedTranslation = translationPixels / Math.max(1, screenSize);

	// If translation is essentially zero, velocity alone shouldn't trigger dismissal.
	// User must have meaningfully moved in the dismiss direction.
	if (Math.abs(normalizedTranslation) < EPSILON) {
		return false;
	}

	const normalizedVelocity = normalizeVelocity(
		velocityPixelsPerSecond,
		screenSize,
	);

	const projectedNormalizedPosition =
		normalizedTranslation + normalizedVelocity * velocityWeight;

	// The dismiss direction is determined by the sign of the translation.
	// Multiplying by this sign normalizes the projection so "toward dismiss" is always positive.
	// This prevents dismissal when the user drags back (opposing velocity flips projection negative).
	const dismissSign = Math.sign(translationPixels);
	const projectedInDismissDirection = projectedNormalizedPosition * dismissSign;
	const exceedsThreshold = projectedInDismissDirection > 0.5;

	return exceedsThreshold;
};

/**
 * Utility function to map raw gesture translation to a progress value.
 */
export const mapGestureToProgress = (
	translation: number,
	dimension: number,
) => {
	"worklet";
	const rawProgress = translation / dimension;
	return Math.max(0, Math.min(1, rawProgress));
};
