interface GetAxisThresholdProps {
	translation: number;
	velocity: number;
	screenSize: number;
	gestureVelocityImpact: number;
}

import type { GestureDirections } from "../../types/gesture.types";

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

import { velocity as V } from "./velocity";

const getAxisThreshold = ({
	translation,
	velocity,
	screenSize,
	gestureVelocityImpact,
}: GetAxisThresholdProps) => {
	"worklet";
	return V.shouldPassDismissalThreshold(
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
