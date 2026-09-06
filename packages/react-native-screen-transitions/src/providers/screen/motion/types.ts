import type { SharedValue } from "react-native-reanimated";
import type { ActiveGesture } from "../../../types/gesture.types";
import type { MotionTransitionValues } from "./hooks/use-transition-values";

export type MotionAnimationValues = {
	transitionProgress: SharedValue<number>;
	visualProgress: SharedValue<number>;
	willAnimate: SharedValue<number>;
	progressAnimating: SharedValue<number>;
	progressSettled: SharedValue<number>;
	closing: SharedValue<number>;
	entering: SharedValue<number>;
};

type GestureRawValues = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	scale: SharedValue<number>;
	normScale: SharedValue<number>;
	rotation: SharedValue<number>;
};

type GestureSnapshotValues = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	velocity: SharedValue<number>;
	scale: SharedValue<number>;
	normScale: SharedValue<number>;
	focalX: SharedValue<number>;
	focalY: SharedValue<number>;
	pinchOriginX: SharedValue<number>;
	pinchOriginY: SharedValue<number>;
	rotation: SharedValue<number>;
	raw: GestureRawValues;
	active: SharedValue<ActiveGesture | null>;
};

type GestureInternalValues = {
	progressBaseline: SharedValue<number>;
	progressDeltaX: SharedValue<number>;
	progressDeltaY: SharedValue<number>;
	lockedSnapPoint: SharedValue<number | null>;
	snapshot: GestureSnapshotValues;
};

export type MotionGestureValues = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	velocity: SharedValue<number>;
	scale: SharedValue<number>;
	normScale: SharedValue<number>;
	focalX: SharedValue<number>;
	focalY: SharedValue<number>;
	pinchOriginX: SharedValue<number>;
	pinchOriginY: SharedValue<number>;
	rotation: SharedValue<number>;
	raw: GestureRawValues;
	internal: GestureInternalValues;
	dismissing: SharedValue<number>;
	dragging: SharedValue<number>;
	settling: SharedValue<number>;
	initiator: SharedValue<ActiveGesture | null>;
};

export type MotionValues = MotionAnimationValues &
	MotionGestureValues &
	MotionTransitionValues;
