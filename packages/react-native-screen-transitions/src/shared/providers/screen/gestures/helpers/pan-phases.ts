import { clamp } from "react-native-reanimated";
import { FALSE, TRUE } from "../../../../constants";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../utils/animation/emit";
import type {
	GestureDimensions,
	PanGestureEvent,
	PanGestureRuntime,
	PanReleaseResult,
	PanTrackState,
} from "../types";
import {
	applyGestureSensitivity,
	normalizeGestureTranslation,
} from "./gesture-physics";
import { resetGestureValues } from "./gesture-reset";
import { resolveGestureSensitivity } from "./gesture-sensitivity";

export const startPanBase = (runtime: PanGestureRuntime) => {
	"worklet";
	const {
		stores: { gestures, animations },
		gestureStartProgress,
	} = runtime;

	emit(animations.willAnimate, TRUE, FALSE);
	gestures.dragging.set(TRUE);
	gestures.dismissing.set(0);
	gestures.x.set(0);
	gestures.y.set(0);
	gestures.normX.set(0);
	gestures.normY.set(0);
	gestures.raw.x.set(0);
	gestures.raw.y.set(0);
	gestures.raw.normX.set(0);
	gestures.raw.normY.set(0);
	gestureStartProgress.set(animations.progress.get());
};

export const applyGestureSensitivityToPanEvent = (
	event: PanGestureEvent,
	runtime: PanGestureRuntime,
): PanGestureEvent => {
	"worklet";
	const sensitivity = resolveGestureSensitivity(
		runtime.policy.gestureSensitivity,
		runtime.runtimeOverrides,
	);

	return {
		...event,
		translationX: applyGestureSensitivity(event.translationX, sensitivity),
		translationY: applyGestureSensitivity(event.translationY, sensitivity),
		velocityX: applyGestureSensitivity(event.velocityX, sensitivity),
		velocityY: applyGestureSensitivity(event.velocityY, sensitivity),
	};
};

export const trackPanGesture = (
	event: PanGestureEvent,
	rawEvent: PanGestureEvent,
	gestures: PanGestureRuntime["stores"]["gestures"],
	dimensions: GestureDimensions,
): PanTrackState => {
	"worklet";
	const { translationX: x, translationY: y } = event;
	const { translationX: rawX, translationY: rawY } = rawEvent;
	const { width, height } = dimensions;

	const normX = clamp(normalizeGestureTranslation(x, width), -1, 1);
	const normY = clamp(normalizeGestureTranslation(y, height), -1, 1);
	const rawNormX = clamp(normalizeGestureTranslation(rawX, width), -1, 1);
	const rawNormY = clamp(normalizeGestureTranslation(rawY, height), -1, 1);

	gestures.x.set(x);
	gestures.y.set(y);
	gestures.normX.set(normX);
	gestures.normY.set(normY);
	gestures.raw.x.set(rawX);
	gestures.raw.y.set(rawY);
	gestures.raw.normX.set(rawNormX);
	gestures.raw.normY.set(rawNormY);

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
