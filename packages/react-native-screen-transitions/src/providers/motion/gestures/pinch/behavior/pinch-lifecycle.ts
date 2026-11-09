import { clamp, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { EPSILON, TRUE } from "../../../../../constants";
import { animateToProgress } from "../../../animation/animate-to-progress";
import { emitMotionStart } from "../../../animation/emit-motion-start";
import { normalizePinchScale } from "../../shared/physics";
import { snapshotGestureHandoff } from "../../shared/snapshot";
import {
	clearFocalPoint,
	clearTransformTrackingValues,
} from "../../shared/values";
import type {
	GestureCompositionOwner,
	PinchGestureEvent,
	PinchGestureRuntime,
	PinchReleaseResult,
} from "../../types";
import { resetPinchGestureValues } from "./pinch-reset";

/**
 * A pinch drives the screen only when it owns the composition. One that joined a pan (or
 * outlived the pan it joined) only tracks its own values (scale, rotation): the pan keeps its
 * drag, its release and its claim, as a pan that joins a pinch does.
 */
const joinsAnotherGesture = (owner?: SharedValue<GestureCompositionOwner>) => {
	"worklet";
	return owner !== undefined && owner.get() !== "pinch";
};

export const startPinchBase = (
	runtime: PinchGestureRuntime,
	gestureCompositionOwner?: SharedValue<GestureCompositionOwner>,
) => {
	"worklet";
	const {
		stores: { gestures, animations },
	} = runtime;

	if (joinsAnotherGesture(gestureCompositionOwner)) {
		clearTransformTrackingValues(gestures);
		return;
	}

	emitMotionStart(animations);
	gestures.dragging.set(TRUE);
	gestures.dismissing.set(0);
	gestures.settling.set(0);
	gestures.initiator.set(null);
	gestures.velocity.set(0);
	clearTransformTrackingValues(gestures);
	gestures.internal.progressBaseline.set(animations.transitionProgress.get());
};

export const trackPinchGesture = (
	event: PinchGestureEvent,
	rawEvent: PinchGestureEvent,
	gestures: PinchGestureRuntime["stores"]["gestures"],
): void => {
	"worklet";
	const normScale = clamp(normalizePinchScale(event.scale), -1, 1);
	const scale = clamp(1 + normScale, 0, 2);
	const rawNormScale = clamp(normalizePinchScale(rawEvent.scale), -1, 1);
	const rawScale = clamp(1 + rawNormScale, 0, 2);

	gestures.scale.set(scale);
	gestures.normScale.set(normScale);
	gestures.raw.scale.set(rawScale);
	gestures.raw.normScale.set(rawNormScale);

	if (gestures.initiator.get() === null) {
		gestures.initiator.set(
			normScale < 0 ? "pinch-in" : normScale > 0 ? "pinch-out" : null,
		);
	}
};

export const finalizePinchRelease = (
	release: PinchReleaseResult,
	runtime: PinchGestureRuntime,
	requestDismiss?: () => void,
	gestureCompositionOwner?: SharedValue<GestureCompositionOwner>,
) => {
	"worklet";
	const {
		stores: { gestures, animations, system },
	} = runtime;

	if (joinsAnotherGesture(gestureCompositionOwner)) {
		clearTransformTrackingValues(gestures);
		clearFocalPoint(gestures);
		return;
	}

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

	if (!release.shouldDismiss && progressAlreadyAtTarget) {
		system.targetProgress.set(release.target);
		return;
	}

	animateToProgress({
		target: release.target,
		spec: release.transitionSpec,
		emitWillAnimate: false,
		markEntering: false,
		animations,
		targetProgress: system.targetProgress,
		animationProgress: system.animationProgress,
		initialVelocity: release.initialVelocity,
	});

	if (release.shouldDismiss && requestDismiss) {
		scheduleOnRN(requestDismiss);
	}
};
