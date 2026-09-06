import type { MotionGestureValues } from "../../types";

export const clearRawPanValues = (gestures: MotionGestureValues) => {
	"worklet";
	gestures.raw.x.set(0);
	gestures.raw.y.set(0);
	gestures.raw.normX.set(0);
	gestures.raw.normY.set(0);
};

export const clearPanProgressDeltaValues = (gestures: MotionGestureValues) => {
	"worklet";
	gestures.internal.progressDeltaX.set(0);
	gestures.internal.progressDeltaY.set(0);
};

export const clearPanProgressValues = (gestures: MotionGestureValues) => {
	"worklet";
	gestures.x.set(0);
	gestures.y.set(0);
	gestures.normX.set(0);
	gestures.normY.set(0);
	clearPanProgressDeltaValues(gestures);
};

export const clearPanTrackingValues = (gestures: MotionGestureValues) => {
	"worklet";
	clearPanProgressValues(gestures);
	clearRawPanValues(gestures);
	gestures.velocity.set(0);
};

export const clearFocalPoint = (gestures: MotionGestureValues) => {
	"worklet";
	gestures.focalX.set(0);
	gestures.focalY.set(0);
	gestures.pinchOriginX.set(0);
	gestures.pinchOriginY.set(0);
};

export const clearRawTransformValues = (gestures: MotionGestureValues) => {
	"worklet";
	gestures.raw.scale.set(1);
	gestures.raw.normScale.set(0);
	gestures.raw.rotation.set(0);
};

export const clearTransformTrackingValues = (gestures: MotionGestureValues) => {
	"worklet";
	gestures.scale.set(1);
	gestures.normScale.set(0);
	gestures.rotation.set(0);
	clearRawTransformValues(gestures);
};
