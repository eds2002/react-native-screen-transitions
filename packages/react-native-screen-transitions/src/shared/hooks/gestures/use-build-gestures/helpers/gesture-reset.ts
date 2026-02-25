import type {
	GestureStateChangeEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import {
	DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
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
	gestureReleaseVelocityMax?: number;
}

export const resetGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
	event,
	dimensions,
	gestureReleaseVelocityScale = DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	gestureReleaseVelocityMax = DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
}: ResetGestureValuesProps) => {
	"worklet";

	const effectiveReleaseVelocityMax = Math.max(
		0,
		Math.abs(gestureReleaseVelocityMax),
	);

	const vxNorm = normalizeVelocity(
		event.velocityX,
		dimensions.width,
		effectiveReleaseVelocityMax,
	);
	const vyNorm = normalizeVelocity(
		event.velocityY,
		dimensions.height,
		effectiveReleaseVelocityMax,
	);

	// Ensure spring starts moving toward zero using normalized gesture values for direction.
	const nx =
		gestures.normX.value || event.translationX / Math.max(1, dimensions.width);

	const ny =
		gestures.normY.value || event.translationY / Math.max(1, dimensions.height);

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
				value: gestures.normX,
				toValue: 0,
				config: { ...spec, velocity: resetVX },
			},
			{
				value: gestures.normY,
				toValue: 0,
				config: { ...spec, velocity: resetVY },
			},
		],
		onAllFinished: () => {
			"worklet";
			gestures.direction.value = null;
		},
	});

	gestures.dragging.value = FALSE;
	gestures.dismissing.value = shouldDismiss ? TRUE : FALSE;
};
