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
	directions: {
		vertical: boolean;
		verticalInverted: boolean;
		horizontal: boolean;
		horizontalInverted: boolean;
	};
	dimensions: { width: number; height: number };
	gestureVelocityImpact: number;
}

// Note: we normalize velocity by the axis dimension to map px/s to progress/s.
// This produces consistent behavior across devices and enables realistic bounce.

const MAX_PROGRESS_VELOCITY = 3.5; // ~3 progress units/second

const getAxisThreshold = ({
	translation,
	velocity,
	screenSize,
	gestureVelocityImpact,
}: GetAxisThresholdProps) => {
	"worklet";
	const finalTranslation = translation + velocity * gestureVelocityImpact;

	return (
		Math.abs(finalTranslation) > screenSize / 2 &&
		(velocity !== 0 || translation !== 0)
	);
};

const getVelocity = (
	dimensions: { width: number; height: number },
	velocityX: number,
	velocityY: number,
	dismissAxis: "x" | "y",
): number => {
	"worklet";
	const axisSize = dismissAxis === "y" ? dimensions.height : dimensions.width;
	const axisVelocityPx = dismissAxis === "y" ? velocityY : velocityX;
	let velocity = axisVelocityPx / Math.max(1, axisSize);

	if (velocity > MAX_PROGRESS_VELOCITY) velocity = MAX_PROGRESS_VELOCITY;
	if (velocity < -MAX_PROGRESS_VELOCITY) velocity = -MAX_PROGRESS_VELOCITY;

	return velocity ?? 0;
};

export const determineDismissal = ({
	event,
	directions,
	dimensions,
	gestureVelocityImpact,
}: DetermineDismissalProps) => {
	"worklet";

	let shouldDismiss: boolean = false;
	let dismissAxis: "x" | "y" = "x";

	if (directions.vertical && event.translationY > 0) {
		const dismiss = getAxisThreshold({
			translation: event.translationY,
			velocity: event.velocityY,
			screenSize: dimensions.height,
			gestureVelocityImpact,
		});
		if (dismiss) {
			dismissAxis = "y";
			shouldDismiss = true;
		}
	}
	if (directions.verticalInverted && event.translationY < 0) {
		const dismiss = getAxisThreshold({
			translation: event.translationY,
			velocity: event.velocityY,
			screenSize: dimensions.height,
			gestureVelocityImpact,
		});
		if (dismiss) {
			dismissAxis = "y";
			shouldDismiss = true;
		}
	}
	if (directions.horizontal && event.translationX > 0) {
		const dismiss = getAxisThreshold({
			translation: event.translationX,
			velocity: event.velocityX,
			screenSize: dimensions.width,
			gestureVelocityImpact,
		});
		if (dismiss) {
			dismissAxis = "x";
			shouldDismiss = true;
		}
	}
	if (directions.horizontalInverted && event.translationX < 0) {
		const dismiss = getAxisThreshold({
			translation: event.translationX,
			velocity: event.velocityX,
			screenSize: dimensions.width,
			gestureVelocityImpact,
		});

		if (dismiss) {
			dismissAxis = "x";
			shouldDismiss = true;
		}
	}

	const velocity = getVelocity(
		dimensions,
		event.velocityX,
		event.velocityY,
		dismissAxis,
	);

	return { shouldDismiss, velocity };
};
