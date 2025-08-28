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

const VELOCITY_SCALE_FACTOR = 0.001;

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

	// Adjust for 0-1 scale
	const velocity =
		(dismissAxis === "y" ? event.velocityY : event.velocityX) *
		VELOCITY_SCALE_FACTOR;
	return { shouldDismiss, velocity };
};
