import { clamp } from "react-native-reanimated";
import { FALSE, TRUE } from "../../../../constants";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../utils/animation/emit";
import type {
	GestureDimensions,
	PanGestureEvent,
	PanGesturePolicy,
	PanGestureRuntime,
	PanReleaseResult,
	PanTrackState,
} from "../types";
import {
	applyGestureSensitivity,
	normalizeGestureTranslation,
} from "./gesture-physics";
import { resetGestureValues } from "./gesture-reset";

export const startPanBase = (runtime: PanGestureRuntime) => {
	"worklet";
	const {
		stores: { gestures, animations },
		gestureStartProgress,
	} = runtime;

	emit(animations.willAnimate, TRUE, FALSE);
	gestures.dragging.set(TRUE);
	gestures.dismissing.set(0);
	gestureStartProgress.set(animations.progress.get());
};

export const resolveSensitivePanGestureEvent = (
	event: PanGestureEvent,
	policy: PanGesturePolicy,
): PanGestureEvent => {
	"worklet";
	return {
		...event,
		translationX: applyGestureSensitivity(
			event.translationX,
			policy.gestureSensitivity,
		),
		translationY: applyGestureSensitivity(
			event.translationY,
			policy.gestureSensitivity,
		),
		velocityX: applyGestureSensitivity(
			event.velocityX,
			policy.gestureSensitivity,
		),
		velocityY: applyGestureSensitivity(
			event.velocityY,
			policy.gestureSensitivity,
		),
	};
};

export const trackPanGesture = (
	event: PanGestureEvent,
	gestures: PanGestureRuntime["stores"]["gestures"],
	dimensions: GestureDimensions,
): PanTrackState => {
	"worklet";
	const { translationX: x, translationY: y } = event;
	const { width, height } = dimensions;

	const normX = clamp(normalizeGestureTranslation(x, width), -1, 1);
	const normY = clamp(normalizeGestureTranslation(y, height), -1, 1);

	gestures.x.set(x);
	gestures.y.set(y);
	gestures.normX.set(normX);
	gestures.normY.set(normY);

	return {
		x,
		y,
		normX,
		normY,
	};
};

export const finalizePanRelease = (
	release: PanReleaseResult,
	runtime: PanGestureRuntime,
	event: PanGestureEvent,
	dimensions: GestureDimensions,
	dismissScreen: (() => void) | undefined,
) => {
	"worklet";
	const {
		stores: { gestures, animations, system },
	} = runtime;

	resetGestureValues({
		spec: release.resetSpec,
		gestures,
		shouldDismiss: release.shouldDismiss,
		event,
		dimensions,
		gestureReleaseVelocityScale: runtime.policy.gestureReleaseVelocityScale,
	});

	animateToProgress({
		target: release.target,
		onAnimationFinish: release.shouldDismiss ? dismissScreen : undefined,
		spec: release.transitionSpec,
		emitWillAnimate: false,
		targetProgress: system.targetProgress,
		animations,
		initialVelocity: release.initialVelocity,
	});
};
