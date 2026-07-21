import { clamp, runOnJS, type SharedValue } from "react-native-reanimated";
import { EPSILON, FALSE, TRUE } from "../../../../../constants";
import { animateToProgress } from "../../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../../utils/animation/emit";
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
	PanTrackState,
} from "../../types";
import { buildPanReleasePlan } from "./pan-release";
import { resetPanGestureValues } from "./pan-reset";

export const startPanBase = (runtime: PanGestureRuntime) => {
	"worklet";
	const {
		stores: { gestures, animations },
	} = runtime;

	const wasSettling = gestures.settling.get();
	const hasResidualGesture =
		Math.abs(gestures.normX.get()) > EPSILON ||
		Math.abs(gestures.normY.get()) > EPSILON ||
		Math.abs(gestures.normScale.get()) > EPSILON ||
		Math.abs(gestures.rotation.get()) > EPSILON;

	if (!wasSettling || !hasResidualGesture) {
		emit(animations.willAnimate, TRUE, FALSE);
	}

	gestures.dragging.set(TRUE);
	gestures.dismissing.set(0);
	gestures.settling.set(0);
	clearPanTrackingValues(gestures);
	clearTransformTrackingValues(gestures);
	clearFocalPoint(gestures);
	gestures.internal.progressBaseline.set(animations.transitionProgress.get());
};

export const trackPanGesture = (
	event: PanGestureEvent,
	rawEvent: PanGestureEvent,
	gestures: PanGestureRuntime["stores"]["gestures"],
	dimensions: GestureDimensions,
): PanTrackState => {
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

	gestures.x.set(x);
	gestures.y.set(y);
	gestures.normX.set(normX);
	gestures.normY.set(normY);
	gestures.internal.progressDeltaX.set(normX);
	gestures.internal.progressDeltaY.set(normY);
	gestures.velocity.set(velocity);
	gestures.raw.x.set(rawX);
	gestures.raw.y.set(rawY);
	gestures.raw.normX.set(rawNormX);
	gestures.raw.normY.set(rawNormY);

	return {
		x,
		y,
		normX,
		normY,
		velocity,
	};
};

export const finalizePanRelease = (
	release: PanReleaseResult,
	runtime: PanGestureRuntime,
	dismissScreen: ((finished: boolean) => void) | undefined,
	dimensions: GestureDimensions,
	rawEvent: PanGestureEvent,
	requestDismiss?: () => void,
	gestureCompositionOwner?: SharedValue<GestureCompositionOwner>,
) => {
	"worklet";
	const {
		policy,
		stores: { gestures, animations, system },
	} = runtime;

	const canDriveRelease =
		!gestureCompositionOwner || gestureCompositionOwner.get() === "pan";

	const plan = buildPanReleasePlan(
		canDriveRelease
			? release
			: {
					target: animations.transitionProgress.get(),
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
		animations.transitionProgress.set(plan.commitProgress);
		system.targetProgress.set(plan.commitProgress);
	}

	if (canDriveRelease && plan.shouldDismiss) {
		snapshotGestureHandoff(gestures, {
			velocity: plan.handoffVelocity,
		});
	}

	resetPanGestureValues({
		plan,
		gestures,
		updateLifecycle: canDriveRelease,
	});

	if (!canDriveRelease) {
		return;
	}

	const progressAlreadyAtTarget =
		Math.abs(animations.transitionProgress.get() - plan.target) <= EPSILON;

	if (!plan.shouldDismiss && progressAlreadyAtTarget) {
		system.targetProgress.set(plan.target);
		animations.progressAnimating.set(FALSE);
		return;
	}

	if (plan.shouldDismiss && requestDismiss) {
		runOnJS(requestDismiss)();
	}

	animateToProgress({
		target: plan.target,
		onAnimationFinish: plan.shouldDismiss ? dismissScreen : undefined,
		spec: plan.transitionSpec,
		emitWillAnimate: false,
		markEntering: false,
		targetProgress: system.targetProgress,
		animations,
		initialVelocity: plan.progressVelocity,
	});
};
