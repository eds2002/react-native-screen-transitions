import type { PinchGestureEvent } from "react-native-gesture-handler";
import { clamp } from "react-native-reanimated";
import { FALSE, TRUE } from "../../../../constants";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../utils/animation/emit";
import type {
	PinchGesturePolicy,
	PinchGestureRuntime,
	PinchReleaseResult,
	PinchTrackState,
} from "../types";
import {
	applyGestureSensitivity,
	normalizePinchScale,
} from "./gesture-physics";
import { resetPinchGestureValues } from "./gesture-reset";

export const startPinchBase = (
	runtime: PinchGestureRuntime,
	event: PinchGestureEvent,
) => {
	"worklet";
	const {
		stores: { gestures, animations },
		gestureStartProgress,
	} = runtime;

	emit(animations.willAnimate, TRUE, FALSE);
	gestures.dragging.set(TRUE);
	gestures.dismissing.set(0);
	gestures.direction.set(null);
	gestures.scale.set(1);
	gestures.normScale.set(0);
	gestures.focalX.set(event.focalX);
	gestures.focalY.set(event.focalY);
	gestureStartProgress.set(animations.progress.get());
};

export const trackPinchGesture = (
	event: PinchGestureEvent,
	policy: PinchGesturePolicy,
	gestures: PinchGestureRuntime["stores"]["gestures"],
): PinchTrackState => {
	"worklet";
	const normScale = clamp(
		applyGestureSensitivity(
			normalizePinchScale(event.scale),
			policy.gestureSensitivity,
		),
		-1,
		1,
	);
	const scale = clamp(1 + normScale, 0, 2);

	gestures.scale.set(scale);
	gestures.normScale.set(normScale);
	gestures.focalX.set(event.focalX);
	gestures.focalY.set(event.focalY);

	return {
		scale,
		normScale,
	};
};

export const finalizePinchRelease = (
	release: PinchReleaseResult,
	runtime: PinchGestureRuntime,
	dismissScreen: (() => void) | undefined,
) => {
	"worklet";
	const {
		stores: { gestures, animations, system },
	} = runtime;

	resetPinchGestureValues({
		spec: release.resetSpec,
		gestures,
		shouldDismiss: release.shouldDismiss,
	});

	animateToProgress({
		target: release.target,
		onAnimationFinish: release.shouldDismiss ? dismissScreen : undefined,
		spec: release.transitionSpec,
		emitWillAnimate: false,
		animations,
		targetProgress: system.targetProgress,
		initialVelocity: release.initialVelocity,
	});
};
