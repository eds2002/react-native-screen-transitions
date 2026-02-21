import type {
	GestureStateChangeEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import {
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	FALSE,
	TRUE,
} from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../types/animation.types";
import { animateMany } from "../../../../utils/animation/animate-many";
import {
	calculateRestoreVelocityTowardZero,
	normalizeVelocity,
} from "./gesture-physics";

interface ResetGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
	event: GestureStateChangeEvent<PanGestureHandlerEventPayload>;
	dimensions: { width: number; height: number };
	gestureReleaseVelocityScale?: number;
}

export const resetGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
	event,
	dimensions,
	gestureReleaseVelocityScale = DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
}: ResetGestureValuesProps) => {
	"worklet";

	const vxNorm = normalizeVelocity(event.velocityX, dimensions.width);
	const vyNorm = normalizeVelocity(event.velocityY, dimensions.height);

	// Ensure spring starts moving toward zero using normalized gesture values for direction.
	const nx =
		gestures.normalizedX.value ||
		event.translationX / Math.max(1, dimensions.width);

	const ny =
		gestures.normalizedY.value ||
		event.translationY / Math.max(1, dimensions.height);

	const vxTowardZero = calculateRestoreVelocityTowardZero(nx, vxNorm);
	const vyTowardZero = calculateRestoreVelocityTowardZero(ny, vyNorm);

	// When dismissing, use raw fling velocity (scaled by gestureReleaseVelocityScale)
	// so the spring carries the gesture's momentum. The spec controls the
	// spring character — use an underdamped spec (e.g. FlingSpec) for orbit/fling.
	const resetVX = shouldDismiss
		? vxNorm * gestureReleaseVelocityScale
		: vxTowardZero;

	const resetVY = shouldDismiss
		? vyNorm * gestureReleaseVelocityScale
		: vyTowardZero;

	animateMany({
		items: [
			{
				value: gestures.x,
				toValue: 0,
				config: { ...spec, velocity: resetVX },
			},
			{
				value: gestures.y,
				toValue: 0,
				config: { ...spec, velocity: resetVY },
			},
			{
				value: gestures.normalizedX,
				toValue: 0,
				config: { ...spec, velocity: resetVX },
			},
			{
				value: gestures.normalizedY,
				toValue: 0,
				config: { ...spec, velocity: resetVY },
			},
		],
		onAllFinished: () => {
			"worklet";
			gestures.direction.value = null;
		},
	});

	gestures.isDragging.value = FALSE;
	gestures.isDismissing.value = shouldDismiss ? TRUE : FALSE;
};
