import type { RotationGestureEvent, RotationGestureRuntime } from "../../types";

export const startRotationGesture = (
	gestures: RotationGestureRuntime["stores"]["gestures"],
) => {
	"worklet";
	gestures.rotation.set(0);
	gestures.raw.rotation.set(0);
};

export const trackRotationGesture = (
	event: RotationGestureEvent,
	rawEvent: RotationGestureEvent,
	gestures: RotationGestureRuntime["stores"]["gestures"],
) => {
	"worklet";
	gestures.rotation.set(event.rotation);
	gestures.raw.rotation.set(rawEvent.rotation);
};
