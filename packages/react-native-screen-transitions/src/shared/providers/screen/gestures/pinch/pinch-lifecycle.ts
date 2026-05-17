import { clamp } from "react-native-reanimated";
import { EPSILON, FALSE, TRUE } from "../../../../constants";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../utils/animation/emit";
import { normalizePinchScale } from "../shared/physics";
import type {
	PinchGestureEvent,
	PinchGestureRuntime,
	PinchReleaseResult,
	PinchTrackState,
} from "../types";
import { resetPinchGestureValues } from "./pinch-reset";

export const startPinchBase = (
	runtime: PinchGestureRuntime,
	event: PinchGestureEvent,
) => {
	"worklet";
	const {
		stores: { gestures, animations },
		gestureProgressBaseline,
	} = runtime;

	const wasSettling = gestures.settling.get();
	const hasResidualGesture = Math.abs(gestures.normScale.get()) > EPSILON;

	if (!wasSettling || !hasResidualGesture) {
		emit(animations.willAnimate, TRUE, FALSE);
	}

	gestures.dragging.set(TRUE);
	gestures.dismissing.set(0);
	gestures.settling.set(0);
	gestures.active.set(null);
	gestures.direction.set(null);
	gestures.velocity.set(0);
	gestures.scale.set(1);
	gestures.normScale.set(0);
	gestures.raw.scale.set(1);
	gestures.raw.normScale.set(0);
	gestures.focalX.set(event.focalX);
	gestures.focalY.set(event.focalY);
	gestureProgressBaseline.set(animations.progress.get());
};

export const trackPinchGesture = (
	event: PinchGestureEvent,
	rawEvent: PinchGestureEvent,
	gestures: PinchGestureRuntime["stores"]["gestures"],
): PinchTrackState => {
	"worklet";
	const normScale = clamp(normalizePinchScale(event.scale), -1, 1);
	const scale = clamp(1 + normScale, 0, 2);
	const rawNormScale = clamp(normalizePinchScale(rawEvent.scale), -1, 1);
	const rawScale = clamp(1 + rawNormScale, 0, 2);

	gestures.scale.set(scale);
	gestures.normScale.set(normScale);
	gestures.focalX.set(event.focalX);
	gestures.focalY.set(event.focalY);
	gestures.raw.scale.set(rawScale);
	gestures.raw.normScale.set(rawNormScale);
	gestures.active.set(
		normScale < 0 ? "pinch-in" : normScale > 0 ? "pinch-out" : null,
	);

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

	if (typeof release.commitProgress === "number") {
		animations.progress.set(release.commitProgress);
		system.targetProgress.set(release.commitProgress);
	}

	resetPinchGestureValues({
		spec: release.resetSpec,
		gestures,
		shouldDismiss: release.shouldDismiss,
		resetValuesImmediately: release.resetValuesImmediately,
	});

	animateToProgress({
		target: release.target,
		onAnimationFinish: release.shouldDismiss ? dismissScreen : undefined,
		spec: release.transitionSpec,
		emitWillAnimate: false,
		markEntering: false,
		animations,
		targetProgress: system.targetProgress,
		initialVelocity: release.initialVelocity,
	});
};
