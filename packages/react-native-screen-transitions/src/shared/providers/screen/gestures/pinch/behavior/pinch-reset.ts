import { FALSE, TRUE } from "../../../../../constants";
import type { GestureStoreMap } from "../../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../../types/animation.types";
import { animateMany } from "../../shared/reset";
import {
	clearFocalPoint,
	clearRawTransformValues,
	clearTransformTrackingValues,
} from "../../shared/values";

interface ResetPinchGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
	resetValuesImmediately?: boolean;
}

export const resetPinchGestureValues = ({
	spec,
	gestures,
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
		gestures.active.set(null);
		gestures.direction.set(null);
		gestures.settling.set(FALSE);
	};

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
