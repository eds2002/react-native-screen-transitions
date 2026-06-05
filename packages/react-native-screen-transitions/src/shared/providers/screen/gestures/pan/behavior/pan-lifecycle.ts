import { clamp, runOnJS, type SharedValue } from "react-native-reanimated";
import { EPSILON, FALSE, TRUE } from "../../../../../constants";
import { animateToProgress } from "../../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../../utils/animation/emit";
import {
	normalizeGestureTranslation,
	resolveGestureVelocity,
} from "../../shared/physics";
import type {
	GestureCompositionActivation,
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
		gestureProgressBaseline,
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
	gestures.x.set(0);
	gestures.y.set(0);
	gestures.normX.set(0);
	gestures.normY.set(0);
	gestures.velocity.set(0);
	gestures.scale.set(1);
	gestures.normScale.set(0);
	gestures.focalX.set(0);
	gestures.focalY.set(0);
	gestures.rotation.set(0);
	gestures.raw.x.set(0);
	gestures.raw.y.set(0);
	gestures.raw.normX.set(0);
	gestures.raw.normY.set(0);
	gestures.raw.scale.set(1);
	gestures.raw.normScale.set(0);
	gestures.raw.rotation.set(0);
	gestureProgressBaseline.set(animations.progress.get());
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
	gestureCompositionActivation?: SharedValue<GestureCompositionActivation>,
) => {
	"worklet";
	const {
		policy,
		stores: { gestures, animations, system },
	} = runtime;

	const canDriveRelease =
		!gestureCompositionActivation ||
		gestureCompositionActivation.get() === "pan";

	const plan = buildPanReleasePlan(
		canDriveRelease
			? release
			: {
					target: animations.progress.get(),
					shouldDismiss: false,
					initialVelocity: 0,
					resetNormalizedValuesImmediately:
						policy.gestureProgressMode === "progress-driven",
					transitionSpec: undefined,
					resetSpec: policy.transitionSpec?.open,
				},
		runtime,
		dimensions,
		rawEvent,
	);

	if (typeof plan.commitProgress === "number") {
		animations.progress.set(plan.commitProgress);
		system.targetProgress.set(plan.commitProgress);
	}

	resetPanGestureValues({
		spec: plan.resetSpec,
		gestures,
		shouldDismiss: plan.shouldDismiss,
		velocityX: plan.resetVelocityX,
		velocityY: plan.resetVelocityY,
		velocityNormX: plan.resetVelocityNormX,
		velocityNormY: plan.resetVelocityNormY,
		releaseVelocity: plan.releaseVelocity,
		resetNormalizedValues: plan.resetNormalizedValues,
		resetNormalizedValuesImmediately: plan.resetNormalizedValuesImmediately,
		preserveRawValues: plan.preserveRawValues,
		updateLifecycle: canDriveRelease,
	});

	if (!canDriveRelease) {
		return;
	}

	const progressAlreadyAtTarget =
		Math.abs(animations.progress.get() - plan.target) <= EPSILON;

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
