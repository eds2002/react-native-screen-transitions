import { clamp, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { EPSILON, TRUE } from "../../../../../constants";
import { animateToProgress } from "../../../animation/animate-to-progress";
import { emitMotionStart } from "../../../animation/emit-motion-start";
import type { MotionGestureValues } from "../../../types";
import {
	normalizeGestureTranslation,
	resolveGestureVelocity,
} from "../../shared/physics";
import { snapshotGestureHandoff } from "../../shared/snapshot";
import {
	clearFocalPoint,
	clearPanTrackingValues,
	clearTransformTrackingValues,
} from "../../shared/values";
import type {
	GestureCompositionOwner,
	GestureDimensions,
	PanGestureEvent,
	PanGestureRuntime,
	PanReleaseResult,
} from "../../types";
import { buildPanReleasePlan } from "./pan-release";
import { resetPanGestureValues } from "./pan-reset";

export const startPanBase = (runtime: PanGestureRuntime) => {
	"worklet";
	const { values } = runtime;

	emitMotionStart(values);

	// A drag released short of dismissing springs its offset back: the progress delta on top of
	// transitionProgress, and x/y/normX/normY for interpolators that read them. A drag that starts
	// before that spring finishes continues from what is on screen, not from rest, so fold the delta
	// into transitionProgress and carry the gesture values into the new drag before clearing them.
	const { internal } = values;
	const deltaInFlight =
		Math.abs(internal.progressDeltaX.get()) > EPSILON ||
		Math.abs(internal.progressDeltaY.get()) > EPSILON;
	if (deltaInFlight) {
		values.transitionProgress.set(values.visualProgress.get());
	} else if (runtime.participation.effectiveSnapPoints.hasSnapPoints) {
		// A sheet's progress is its position: stop whatever is animating it (a snapTo, a release's
		// spring) so it doesn't keep moving under the finger and the release starts from where it is.
		values.transitionProgress.set(values.transitionProgress.get());
	}
	internal.carry.x.set(values.x.get());
	internal.carry.y.set(values.y.get());
	internal.carry.normX.set(values.normX.get());
	internal.carry.normY.set(values.normY.get());

	values.dragging.set(TRUE);
	values.dismissing.set(0);
	values.settling.set(0);
	clearPanTrackingValues(values);
	// Hold the carried values (stopping their spring) until the first update adds the new translation.
	values.x.set(internal.carry.x.get());
	values.y.set(internal.carry.y.get());
	values.normX.set(internal.carry.normX.get());
	values.normY.set(internal.carry.normY.get());
	clearTransformTrackingValues(values);
	clearFocalPoint(values);
	values.internal.progressBaseline.set(values.transitionProgress.get());
};

export const trackPanGesture = (
	event: PanGestureEvent,
	rawEvent: PanGestureEvent,
	gestures: MotionGestureValues,
	dimensions: GestureDimensions,
): void => {
	"worklet";
	const { translationX: x, translationY: y } = event;
	const {
		translationX: rawX,
		translationY: rawY,
		velocityX,
		velocityY,
	} = rawEvent;
	const { width, height } = dimensions;

	const normX = clamp(normalizeGestureTranslation(x, width), -1, 1);
	const normY = clamp(normalizeGestureTranslation(y, height), -1, 1);
	const rawNormX = clamp(normalizeGestureTranslation(rawX, width), -1, 1);
	const rawNormY = clamp(normalizeGestureTranslation(rawY, height), -1, 1);
	const velocity = resolveGestureVelocity(
		velocityX / Math.max(1, width),
		velocityY / Math.max(1, height),
	);

	// Values the drag picked up from a spring-back in flight (see startPanBase). The progress delta
	// doesn't take them: that part was folded into transitionProgress.
	const { carry } = gestures.internal;
	gestures.x.set(x + carry.x.get());
	gestures.y.set(y + carry.y.get());
	gestures.normX.set(clamp(normX + carry.normX.get(), -1, 1));
	gestures.normY.set(clamp(normY + carry.normY.get(), -1, 1));
	gestures.internal.progressDeltaX.set(normX);
	gestures.internal.progressDeltaY.set(normY);
	gestures.velocity.set(velocity);
	gestures.raw.x.set(rawX);
	gestures.raw.y.set(rawY);
	gestures.raw.normX.set(rawNormX);
	gestures.raw.normY.set(rawNormY);
};

export const finalizePanRelease = (
	release: PanReleaseResult,
	runtime: PanGestureRuntime,
	dimensions: GestureDimensions,
	rawEvent: PanGestureEvent,
	requestDismiss?: () => void,
	gestureCompositionOwner?: SharedValue<GestureCompositionOwner>,
) => {
	"worklet";
	const { policy, values } = runtime;

	const canDriveRelease =
		!gestureCompositionOwner || gestureCompositionOwner.get() === "pan";

	const plan = buildPanReleasePlan(
		canDriveRelease
			? release
			: {
					target: values.transitionProgress.get(),
					shouldDismiss: false,
					initialVelocity: 0,
					transitionSpec: undefined,
					resetSpec: policy.transitionSpec?.open,
				},
		runtime,
		dimensions,
		rawEvent,
	);

	if (typeof plan.commitProgress === "number") {
		values.transitionProgress.set(plan.commitProgress);
		values.targetProgress.set(plan.commitProgress);
	}

	const progressAlreadyAtTarget =
		Math.abs(values.transitionProgress.get() - plan.target) <= EPSILON;

	if (canDriveRelease && plan.shouldDismiss) {
		snapshotGestureHandoff(values, {
			velocity: plan.handoffVelocity,
		});
	}

	resetPanGestureValues({
		plan,
		values,
		completeMotion: !plan.shouldDismiss && progressAlreadyAtTarget,
		updateLifecycle: canDriveRelease,
	});

	if (!canDriveRelease) {
		return;
	}

	if (!plan.shouldDismiss && progressAlreadyAtTarget) {
		values.targetProgress.set(plan.target);
		return;
	}

	animateToProgress({
		target: plan.target,
		spec: plan.transitionSpec,
		emitWillAnimate: false,
		markEntering: false,
		values,
		initialVelocity: plan.progressVelocity,
	});

	if (plan.shouldDismiss && requestDismiss) {
		scheduleOnRN(requestDismiss);
	}
};
