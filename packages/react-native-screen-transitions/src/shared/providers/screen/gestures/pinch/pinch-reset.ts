import { EPSILON, FALSE, TRUE } from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../types/animation.types";
import {
	animateResetValue,
	clearGestureSettlingIfResting,
	getGestureResetSpec,
} from "../shared/reset";

interface ResetPinchGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
	resetValuesImmediately?: boolean;
}

const clearPinchSettlingIfResting = (gestures: GestureStoreMap) => {
	"worklet";

	const isResting =
		!gestures.dragging.get() &&
		!gestures.dismissing.get() &&
		Math.abs(gestures.scale.get() - 1) <= EPSILON &&
		Math.abs(gestures.normScale.get()) <= EPSILON;

	if (isResting) {
		gestures.focalX.set(0);
		gestures.focalY.set(0);
	}

	clearGestureSettlingIfResting(gestures, isResting);
};

export const resetPinchGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
	resetValuesImmediately = false,
}: ResetPinchGestureValuesProps) => {
	"worklet";
	const resetSpec = getGestureResetSpec(spec);

	if (!shouldDismiss) {
		gestures.raw.scale.set(1);
		gestures.raw.normScale.set(0);
	}

	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
	gestures.settling.set(shouldDismiss ? FALSE : TRUE);

	if (resetValuesImmediately) {
		gestures.scale.set(1);
		gestures.normScale.set(0);
		clearPinchSettlingIfResting(gestures);
		return;
	}

	animateResetValue(gestures.scale, 1, resetSpec, () =>
		clearPinchSettlingIfResting(gestures),
	);
	animateResetValue(gestures.normScale, 0, resetSpec, () =>
		clearPinchSettlingIfResting(gestures),
	);
};
