import { clamp } from "react-native-reanimated";
import { EPSILON } from "../../../../constants";
import type { AnimationStoreMap } from "../../../../stores/animation.store";
import type { GestureDirections } from "../../../../types/gesture.types";
import type { PanGestureEvent } from "../types";

interface CalculateProgressProps {
	animations: AnimationStoreMap;
	shouldDismiss: boolean;
	event: PanGestureEvent;
	dimensions: { width: number; height: number };
	directions: GestureDirections;
	gestureReleaseVelocityScale?: number;
}

type GestureAxisCandidate = {
	progressContribution: number;
	velocityContribution: number;
};

/**
 * Converts a pan velocity from pixels/second into progress/second.
 */
export const toProgressVelocity = (
	velocityPixelsPerSecond: number,
	screenSize: number,
) => {
	"worklet";
	return velocityPixelsPerSecond / Math.max(1, screenSize);
};

/**
 * Converts pan release velocity into a spring handoff in progress units/second.
 */
export const getPanReleaseHandoffVelocity = (
	velocityPixelsPerSecond: number,
	screenSize: number,
	gestureReleaseVelocityScale: number = 1,
) => {
	"worklet";
	return (
		toProgressVelocity(velocityPixelsPerSecond, screenSize) *
		Math.max(0, gestureReleaseVelocityScale)
	);
};

/**
 * Converts pinch scale velocity into a spring handoff in progress units/second.
 */
export const getPinchReleaseHandoffVelocity = (
	velocityScalePerSecond: number,
	gestureReleaseVelocityScale: number = 1,
) => {
	"worklet";
	return velocityScalePerSecond * Math.max(0, gestureReleaseVelocityScale);
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
 * Picks the dominant active pan axis and returns a release handoff velocity
 * in progress units/second oriented toward the animation target.
 */
export const getPanReleaseProgressVelocity = ({
	animations,
	shouldDismiss,
	event,
	dimensions,
	directions,
	gestureReleaseVelocityScale,
}: CalculateProgressProps) => {
	"worklet";

	const currentProgress = animations.progress.get();
	const targetProgress = shouldDismiss ? 0 : 1;
	const progressDelta = targetProgress - currentProgress;

	const progressDirection = progressDelta === 0 ? 0 : Math.sign(progressDelta);

	const candidates: GestureAxisCandidate[] = [];

	if (directions.horizontal && event.translationX > 0) {
		candidates.push({
			progressContribution: event.translationX / Math.max(1, dimensions.width),
			velocityContribution: getPanReleaseHandoffVelocity(
				event.velocityX,
				dimensions.width,
				gestureReleaseVelocityScale,
			),
		});
	}

	if (directions.horizontalInverted && event.translationX < 0) {
		candidates.push({
			progressContribution: -event.translationX / Math.max(1, dimensions.width),
			velocityContribution: getPanReleaseHandoffVelocity(
				-event.velocityX,
				dimensions.width,
				gestureReleaseVelocityScale,
			),
		});
	}

	if (directions.vertical && event.translationY > 0) {
		candidates.push({
			progressContribution: event.translationY / Math.max(1, dimensions.height),
			velocityContribution: getPanReleaseHandoffVelocity(
				event.velocityY,
				dimensions.height,
				gestureReleaseVelocityScale,
			),
		});
	}

	if (directions.verticalInverted && event.translationY < 0) {
		candidates.push({
			progressContribution:
				-event.translationY / Math.max(1, dimensions.height),
			velocityContribution: getPanReleaseHandoffVelocity(
				-event.velocityY,
				dimensions.height,
				gestureReleaseVelocityScale,
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
		const normalizedVelocityX = getPanReleaseHandoffVelocity(
			event.velocityX,
			dimensions.width,
			gestureReleaseVelocityScale,
		);
		const normalizedVelocityY = getPanReleaseHandoffVelocity(
			event.velocityY,
			dimensions.height,
			gestureReleaseVelocityScale,
		);
		progressVelocityMagnitude = Math.max(
			Math.abs(normalizedVelocityX),
			Math.abs(normalizedVelocityY),
		);
	}

	return progressDirection * progressVelocityMagnitude;
};

/**
 * Determines if a gesture should trigger dismissal based on combined
 * translation and velocity in normalized screen units (0-1 range).
 *
 * Formula: |translation/screen + velocity/screen * velocityWeight| > 0.5
 */
export const shouldDismissFromProjection = (
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

	const normalizedVelocity = toProgressVelocity(
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

/**
 * Scales live gesture movement before it is applied to transition progress.
 * Lower values reduce sensitivity, higher values increase it.
 */
export const applyGestureSensitivity = (
	progressDelta: number,
	gestureSensitivity: number = 1,
) => {
	"worklet";
	return progressDelta * Math.max(0, gestureSensitivity);
};

/**
 * Normalizes pinch scale so idle is 0, pinch-in is negative, and pinch-out is positive.
 * This intentionally returns the raw delta so sensitivity can be applied before
 * the live gesture is clamped into progress space.
 *
 * Examples:
 * - 0.5 scale => -0.5
 * - 1.0 scale => 0
 * - 1.5 scale => 0.5
 * - 2.0 scale => 1
 * - 3.0 scale => 2
 */
export const normalizePinchScale = (scale: number) => {
	"worklet";
	return scale - 1;
};

export const shouldDismissFromPinch = (
	normalizedScale: number,
	pinchInEnabled: boolean,
	pinchOutEnabled: boolean,
) => {
	"worklet";
	if (normalizedScale < 0 && !pinchInEnabled) {
		return false;
	}

	if (normalizedScale > 0 && !pinchOutEnabled) {
		return false;
	}

	return Math.abs(normalizedScale) > 0.5;
};
