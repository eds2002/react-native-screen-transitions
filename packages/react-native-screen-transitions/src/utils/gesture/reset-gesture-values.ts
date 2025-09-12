import type { GestureMap } from "../../stores/gestures";
import type { AnimationConfig } from "../../types/animation";
import { animate } from "../animation/animate";

interface ResetGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureMap;
	shouldDismiss: boolean;
}

export const resetGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
}: ResetGestureValuesProps) => {
	"worklet";

	gestures.x.value = animate(0, spec);
	gestures.y.value = animate(0, spec);
	gestures.normalizedX.value = animate(0, spec);
	gestures.normalizedY.value = animate(0, spec);
	gestures.isDragging.value = 0;
	gestures.isDismissing.value = Number(shouldDismiss);
};
