import type { GestureMap } from "../../stores/gestures";
import type { AnimationConfig } from "../../types/animation";
import { animate } from "../animation/animate";

interface ResetGestureValuesProps {
	event: {
		translationX: number;
		translationY: number;
		velocityX: number;
		velocityY: number;
	};
	dimensions: { width: number; height: number };
	spec?: AnimationConfig;
	gestures: GestureMap;
	shouldDismiss: boolean;
}

export const resetGestureValues = ({
	event,
	dimensions,
	spec,
	gestures,
	shouldDismiss,
}: ResetGestureValuesProps) => {
	"worklet";
	const { velocityX, velocityY } = event;

	const vxNorm = velocityX / Math.max(1, dimensions.width);
	const vyNorm = velocityY / Math.max(1, dimensions.height);

	gestures.x.value = animate(0, { ...spec, velocity: velocityX });
	gestures.y.value = animate(0, { ...spec, velocity: velocityY });
	gestures.normalizedX.value = animate(0, { ...spec, velocity: vxNorm });
	gestures.normalizedY.value = animate(0, { ...spec, velocity: vyNorm });
	gestures.isDragging.value = 0;
	gestures.isDismissing.value = Number(shouldDismiss);
};
