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
