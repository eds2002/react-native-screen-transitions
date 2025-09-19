import type {
	GestureStateChangeEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { clamp } from "react-native-reanimated";
import type { AnimationMap } from "../../stores/animations";

interface CalculateProgressProps {
	animations: AnimationMap;
	shouldDismiss: boolean;
	event: GestureStateChangeEvent<PanGestureHandlerEventPayload>;
	dimensions: { width: number; height: number };
	directions: {
		horizontal: boolean;
		horizontalInverted: boolean;
		vertical: boolean;
		verticalInverted: boolean;
	};
}

const MAX_VELOCITY_MAGNITUDE = 3.2;
const NEAR_ZERO_THRESHOLD = 0.01;

/**
 * Converts velocity from pixels/second to normalized units/second (0-1 range)
 * and caps the result for stability
 */
const normalize = (velocityPixelsPerSecond: number, screenSize: number) => {
	"worklet";
	return clamp(
		velocityPixelsPerSecond / Math.max(1, screenSize),
		-MAX_VELOCITY_MAGNITUDE,
		MAX_VELOCITY_MAGNITUDE,
	);
};

/**
 * Calculates a normalized velocity that moves the current value toward zero.
 * Used for spring-back animations when dismissing gestures.
 */
const calculateRestoreVelocity = (
	currentValueNormalized: number,
	baseVelocityNormalized: number,
) => {
	"worklet";

	if (Math.abs(currentValueNormalized) < NEAR_ZERO_THRESHOLD) return 0;

	const directionTowardZero = Math.sign(currentValueNormalized) || 1;
	const clampedVelocity = Math.min(Math.abs(baseVelocityNormalized), 1);

	return -directionTowardZero * clampedVelocity;
};

const calculateProgressVelocity = ({
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

	const normalizedVelocityX = normalize(event.velocityX, dimensions.width);
	const normalizedVelocityY = normalize(event.velocityY, dimensions.height);

	const normalizedTranslationX = Math.abs(
		event.translationX / dimensions.width,
	);
	const normalizedTranslationY = Math.abs(
		event.translationY / dimensions.height,
	);

	const supportsHorizontalGestures =
		directions.horizontal || directions.horizontalInverted;

	const supportsVerticalGestures =
		directions.vertical || directions.verticalInverted;

	let progressVelocityMagnitude = 0;

	// Determine which axis should drive the progress velocity
	if (
		supportsHorizontalGestures &&
		(!supportsVerticalGestures ||
			normalizedTranslationX >= normalizedTranslationY)
	) {
		progressVelocityMagnitude = Math.abs(normalizedVelocityX);
	} else if (supportsVerticalGestures) {
		progressVelocityMagnitude = Math.abs(normalizedVelocityY);
	} else {
		progressVelocityMagnitude = Math.max(
			Math.abs(normalizedVelocityX),
			Math.abs(normalizedVelocityY),
		);
	}

	// Apply direction and clamp to prevent overly energetic springs
	return (
		progressDirection *
		clamp(progressVelocityMagnitude, 0, MAX_VELOCITY_MAGNITUDE)
	);
};

/**
 * Determines if a gesture should trigger dismissal based on combined
 * translation and velocity in normalized screen units (0-1 range).
 *
 * Formula: |translation/screen + clamp(velocity/screen, ±1) * velocityWeight| > 0.5
 */
const shouldPassDismissalThreshold = (
	translationPixels: number,
	velocityPixelsPerSecond: number,
	screenSize: number,
	velocityWeight: number,
) => {
	"worklet";

	const normalizedTranslation = translationPixels / Math.max(1, screenSize);
	const normalizedVelocity = normalize(velocityPixelsPerSecond, screenSize);

	const projectedNormalizedPosition =
		normalizedTranslation + normalizedVelocity * velocityWeight;

	const exceedsThreshold = Math.abs(projectedNormalizedPosition) > 0.5;

	const hasMovement = translationPixels !== 0 || velocityPixelsPerSecond !== 0;

	return exceedsThreshold && hasMovement;
};

export const velocity = {
	normalize,
	calculateRestoreVelocity,
	calculateProgressVelocity,
	shouldPassDismissalThreshold,
};
