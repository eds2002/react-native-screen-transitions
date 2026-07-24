import { clamp, runOnJS } from "react-native-reanimated";
import { EPSILON, TRUE } from "../../../../../constants";
import { emitMotionStart } from "../../../../../stores/animation.store";
import { animateToProgress } from "../../../../../utils/animation/animate-to-progress";
import { normalizePinchScale } from "../../shared/physics";
import { snapshotGestureHandoff } from "../../shared/snapshot";
import { clearTransformTrackingValues } from "../../shared/values";
import type {
	PinchGestureEvent,
	PinchGestureRuntime,
	PinchReleaseResult,
	PinchTrackState,
} from "../../types";
import { resetPinchGestureValues } from "./pinch-reset";

export const startPinchBase = (runtime: PinchGestureRuntime) => {
	"worklet";
	const {
		stores: { gestures, animations },
	} = runtime;

	emitMotionStart(animations);
	gestures.dragging.set(TRUE);
	gestures.dismissing.set(0);
	gestures.settling.set(0);
	gestures.active.set(null);
	gestures.direction.set(null);
	gestures.velocity.set(0);
	clearTransformTrackingValues(gestures);
	gestures.internal.progressBaseline.set(animations.transitionProgress.get());
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
	gestures.raw.scale.set(rawScale);
	gestures.raw.normScale.set(rawNormScale);

	if (gestures.active.get() === null) {
		gestures.active.set(
			normScale < 0 ? "pinch-in" : normScale > 0 ? "pinch-out" : null,
		);
	}

	return {
		scale,
		normScale,
	};
};

export const finalizePinchRelease = (
	release: PinchReleaseResult,
	runtime: PinchGestureRuntime,
	dismissScreen: ((finished: boolean) => void) | undefined,
	requestDismiss?: () => void,
) => {
	"worklet";
	const {
		stores: { gestures, animations, system },
	} = runtime;

	if (typeof release.commitProgress === "number") {
		animations.transitionProgress.set(release.commitProgress);
		system.targetProgress.set(release.commitProgress);
	}

	const progressAlreadyAtTarget =
		Math.abs(animations.transitionProgress.get() - release.target) <= EPSILON;

	if (release.shouldDismiss) {
		snapshotGestureHandoff(gestures, {
			velocity: release.handoffVelocity,
		});
	}

	resetPinchGestureValues({
		spec: release.resetSpec,
		gestures,
		animations,
		shouldDismiss: release.shouldDismiss,
		resetValuesImmediately: release.resetValuesImmediately,
	});

	if (release.shouldDismiss && requestDismiss) {
		runOnJS(requestDismiss)();
	}

	if (!release.shouldDismiss && progressAlreadyAtTarget) {
		system.targetProgress.set(release.target);
		return;
	}

	animateToProgress({
		target: release.target,
		onAnimationFinish: release.shouldDismiss ? dismissScreen : undefined,
		spec: release.transitionSpec,
		emitWillAnimate: false,
		markEntering: false,
		animations,
		targetProgress: system.targetProgress,
		animationProgress: system.animationProgress,
		initialVelocity: release.initialVelocity,
	});
};
