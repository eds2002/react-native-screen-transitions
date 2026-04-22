import {
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	FALSE,
	TRUE,
} from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../types/animation.types";
import { animateMany } from "../../../../utils/animation/animate-many";
import type { PanGestureEvent } from "../types";
import {
	calculateRestoreVelocityTowardZero,
	getPanReleaseHandoffVelocity,
} from "./gesture-physics";

interface ResetGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
	event: PanGestureEvent;
	dimensions: { width: number; height: number };
	gestureReleaseVelocityScale?: number;
}

export const resetGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
	event,
	dimensions,
	gestureReleaseVelocityScale,
}: ResetGestureValuesProps) => {
	"worklet";
	const resolvedGestureReleaseVelocityScale =
		gestureReleaseVelocityScale ?? DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE;
	const vxProgress = getPanReleaseHandoffVelocity(
		event.velocityX,
		dimensions.width,
		resolvedGestureReleaseVelocityScale,
	);
	const vyProgress = getPanReleaseHandoffVelocity(
		event.velocityY,
		dimensions.height,
		resolvedGestureReleaseVelocityScale,
	);

	// Ensure spring starts moving toward zero using normalized gesture values for direction.
	const nx =
		gestures.normX.get() || event.translationX / Math.max(1, dimensions.width);

	const ny =
		gestures.normY.get() || event.translationY / Math.max(1, dimensions.height);

	const vxTowardZero = calculateRestoreVelocityTowardZero(nx, vxProgress);
	const vyTowardZero = calculateRestoreVelocityTowardZero(ny, vyProgress);

	const resetNormVX = shouldDismiss ? vxProgress : vxTowardZero;
	const resetNormVY = shouldDismiss ? vyProgress : vyTowardZero;
	const resetPixelVX = resetNormVX * dimensions.width;
	const resetPixelVY = resetNormVY * dimensions.height;

	animateMany({
		items: [
			{
				value: gestures.x,
				toValue: 0,
				config: { ...spec, velocity: resetPixelVX },
			},
			{
				value: gestures.y,
				toValue: 0,
				config: { ...spec, velocity: resetPixelVY },
			},
			{
				value: gestures.normX,
				toValue: 0,
				config: { ...spec, velocity: resetNormVX },
			},
			{
				value: gestures.normY,
				toValue: 0,
				config: { ...spec, velocity: resetNormVY },
			},
		],
		onAllFinished: () => {
			"worklet";
			gestures.direction.set(null);
		},
	});

	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
};

interface ResetPinchGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
}

export const resetPinchGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
}: ResetPinchGestureValuesProps) => {
	"worklet";

	animateMany({
		items: [
			{
				value: gestures.scale,
				toValue: 1,
				config: { ...spec },
			},
			{
				value: gestures.normScale,
				toValue: 0,
				config: { ...spec },
			},
		],
		onAllFinished: () => {
			"worklet";
			gestures.focalX.set(0);
			gestures.focalY.set(0);
			gestures.direction.set(null);
		},
	});

	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
};
