import { FALSE, TRUE } from "../../../../../constants";
import type { GestureStoreMap } from "../../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../../types/animation.types";
import { animateMany } from "../../shared/reset";

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

		gestures.focalX.set(0);
		gestures.focalY.set(0);
		gestures.active.set(null);
		gestures.direction.set(null);
		gestures.settling.set(FALSE);
	};

	gestures.raw.scale.set(1);
	gestures.raw.normScale.set(0);
	gestures.raw.rotation.set(0);

	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
	gestures.settling.set(shouldDismiss ? FALSE : TRUE);

	if (shouldDismiss) {
		gestures.focalX.set(0);
		gestures.focalY.set(0);
	}

	if (resetValuesImmediately) {
		gestures.scale.set(1);
		gestures.normScale.set(0);
		gestures.rotation.set(0);
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
