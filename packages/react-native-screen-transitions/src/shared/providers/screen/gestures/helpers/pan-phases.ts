import type { PanGestureEvent } from "react-native-gesture-handler";
import { clamp } from "react-native-reanimated";
import { FALSE, TRUE } from "../../../../constants";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../utils/animation/emit";
import type {
	GestureDimensions,
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

export const trackPanGesture = (
	event: PanGestureEvent,
	policy: PanGesturePolicy,
	gestures: PanGestureRuntime["stores"]["gestures"],
	dimensions: GestureDimensions,
): PanTrackState => {
	"worklet";
	const { translationX: rawTX, translationY: rawTY } = event;
	const { width, height } = dimensions;

	const x = applyGestureSensitivity(rawTX, policy.gestureSensitivity);
	const y = applyGestureSensitivity(rawTY, policy.gestureSensitivity);
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
