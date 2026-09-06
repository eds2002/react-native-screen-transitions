import { FALSE, TRUE } from "../../../../../../constants";
import type { AnimationConfig } from "../../../../../../types/animation.types";
import type {
	MotionAnimationValues,
	MotionGestureValues,
} from "../../../types";
import { animateMany } from "../../shared/reset";
import {
	clearFocalPoint,
	clearRawTransformValues,
	clearTransformTrackingValues,
} from "../../shared/values";

interface ResetPinchGestureValuesProps {
	spec?: AnimationConfig;
	gestures: MotionGestureValues;
	animations?: MotionAnimationValues;
	shouldDismiss: boolean;
	resetValuesImmediately?: boolean;
}

export const resetPinchGestureValues = ({
	spec,
	gestures,
	animations,
	shouldDismiss,
	resetValuesImmediately = false,
}: ResetPinchGestureValuesProps) => {
	"worklet";
	const finishPinchReset = () => {
		"worklet";
		if (shouldDismiss) {
			return;
		}

		clearFocalPoint(gestures);
		gestures.initiator.set(null);
		gestures.settling.set(FALSE);
		animations?.progressAnimating.set(FALSE);
		animations?.progressSettled.set(TRUE);
	};

	if (animations && !shouldDismiss) {
		animations.progressAnimating.set(TRUE);
		animations.progressSettled.set(FALSE);
	}

	clearRawTransformValues(gestures);

	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
	gestures.settling.set(shouldDismiss ? FALSE : TRUE);

	if (shouldDismiss) {
		clearFocalPoint(gestures);
	}

	if (resetValuesImmediately) {
		clearTransformTrackingValues(gestures);
		finishPinchReset();
		return;
	}

	animateMany(
		[
			{ value: gestures.scale, toValue: 1 },
			{ value: gestures.normScale, toValue: 0 },
			{ value: gestures.rotation, toValue: 0 },
		],
		spec,
		finishPinchReset,
	);
};
