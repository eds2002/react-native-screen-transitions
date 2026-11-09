import { FALSE, TRUE } from "../../../../../constants";
import type { AnimationConfig } from "../../../../../types/animation.types";
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
	values: MotionGestureValues & MotionAnimationValues;
	shouldDismiss: boolean;
	resetValuesImmediately?: boolean;
}

export const resetPinchGestureValues = ({
	spec,
	values,
	shouldDismiss,
	resetValuesImmediately = false,
}: ResetPinchGestureValuesProps) => {
	"worklet";
	const finishPinchReset = () => {
		"worklet";
		if (shouldDismiss) {
			return;
		}

		clearFocalPoint(values);
		values.initiator.set(null);
		values.settling.set(FALSE);
		values.progressAnimating.set(FALSE);
		values.progressSettled.set(TRUE);
	};

	if (!shouldDismiss) {
		values.progressAnimating.set(TRUE);
		values.progressSettled.set(FALSE);
	}

	clearRawTransformValues(values);

	values.dragging.set(FALSE);
	values.dismissing.set(shouldDismiss ? TRUE : FALSE);
	values.settling.set(shouldDismiss ? FALSE : TRUE);

	if (shouldDismiss) {
		clearFocalPoint(values);
	}

	if (resetValuesImmediately) {
		clearTransformTrackingValues(values);
		finishPinchReset();
		return;
	}

	animateMany(
		[
			{ value: values.scale, toValue: 1 },
			{ value: values.normScale, toValue: 0 },
			{ value: values.rotation, toValue: 0 },
		],
		spec,
		finishPinchReset,
	);
};
