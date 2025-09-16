import type {
	GestureStateChangeEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { GestureMap } from "../../stores/gestures";
import type { AnimationConfig } from "../../types/animation";
import { animate } from "../animation/animate";
import { velocity } from "./velocity";

interface ResetGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureMap;
	shouldDismiss: boolean;
	event: GestureStateChangeEvent<PanGestureHandlerEventPayload>;
	dimensions: { width: number; height: number };
}

export const resetGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
	event,
	dimensions,
}: ResetGestureValuesProps) => {
	"worklet";

	const vxNorm = velocity.normalize(event.velocityX, dimensions.width);
	const vyNorm = velocity.normalize(event.velocityY, dimensions.height);

	// Ensure spring starts moving toward zero using normalized gesture values for direction.
	const nx =
		gestures.normalizedX.value ||
		event.translationX / Math.max(1, dimensions.width);
	const ny =
		gestures.normalizedY.value ||
		event.translationY / Math.max(1, dimensions.height);

	const vxTowardZero = velocity.calculateRestoreVelocity(nx, vxNorm);
	const vyTowardZero = velocity.calculateRestoreVelocity(ny, vyNorm);

	let remainingAnimations = 4;

	const onFinish = (finished: boolean | undefined) => {
		"worklet";
		if (!finished) return;
		remainingAnimations -= 1;
		if (remainingAnimations === 0) {
			gestures.direction.value = null;
		}
	};

	gestures.x.value = animate(0, { ...spec, velocity: vxTowardZero }, onFinish);
	gestures.y.value = animate(0, { ...spec, velocity: vyTowardZero }, onFinish);
	gestures.normalizedX.value = animate(
		0,
		{ ...spec, velocity: vxTowardZero },
		onFinish,
	);
	gestures.normalizedY.value = animate(
		0,
		{ ...spec, velocity: vyTowardZero },
		onFinish,
	);
	gestures.isDragging.value = 0;
	gestures.isDismissing.value = Number(shouldDismiss);
};
