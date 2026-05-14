import { EPSILON, FALSE, TRUE } from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../types/animation.types";
import {
	animateResetValue,
	clearGestureSettlingIfResting,
	getGestureResetSpec,
} from "../shared/reset";

interface ResetPanGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
	velocityX?: number;
	velocityY?: number;
	velocityNormX?: number;
	velocityNormY?: number;
	resetNormalizedValues?: boolean;
	resetNormalizedValuesImmediately?: boolean;
	preserveRawValues?: boolean;
}

const clearPanSettlingIfResting = (gestures: GestureStoreMap) => {
	"worklet";

	clearGestureSettlingIfResting(
		gestures,
		!gestures.dragging.get() &&
			!gestures.dismissing.get() &&
			Math.abs(gestures.x.get()) <= EPSILON &&
			Math.abs(gestures.y.get()) <= EPSILON &&
			Math.abs(gestures.normX.get()) <= EPSILON &&
			Math.abs(gestures.normY.get()) <= EPSILON,
	);
};

export const resetPanGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
	velocityX,
	velocityY,
	velocityNormX,
	velocityNormY,
	resetNormalizedValues = true,
	resetNormalizedValuesImmediately = false,
	preserveRawValues = shouldDismiss,
}: ResetPanGestureValuesProps) => {
	"worklet";

	if (!preserveRawValues) {
		gestures.raw.x.set(0);
		gestures.raw.y.set(0);
		gestures.raw.normX.set(0);
		gestures.raw.normY.set(0);
	}

	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
	gestures.settling.set(shouldDismiss ? FALSE : TRUE);

	animateResetValue(gestures.x, 0, getGestureResetSpec(spec, velocityX), () =>
		clearPanSettlingIfResting(gestures),
	);
	animateResetValue(gestures.y, 0, getGestureResetSpec(spec, velocityY), () =>
		clearPanSettlingIfResting(gestures),
	);

	if (!resetNormalizedValues) {
		return;
	}

	if (resetNormalizedValuesImmediately) {
		gestures.normX.set(0);
		gestures.normY.set(0);
		clearPanSettlingIfResting(gestures);
		return;
	}

	animateResetValue(
		gestures.normX,
		0,
		getGestureResetSpec(spec, velocityNormX),
		() => clearPanSettlingIfResting(gestures),
	);
	animateResetValue(
		gestures.normY,
		0,
		getGestureResetSpec(spec, velocityNormY),
		() => clearPanSettlingIfResting(gestures),
	);
};
