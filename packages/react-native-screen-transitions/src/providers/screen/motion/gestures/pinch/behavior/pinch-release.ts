import { clamp } from "react-native-reanimated";
import {
	getPinchReleaseHandoffVelocity,
	normalizePinchScale,
	resolveGestureVelocityMagnitude,
	shouldDismissFromPinch,
} from "../../shared/physics";
import {
	getProgressVelocityTowardTarget,
	resolveGestureSnapTransitionSpec,
} from "../../shared/release";
import {
	getStepSnapProgressVelocityScale,
	primeRuntimeSnapPoint,
	resolveRuntimeGestureSnapPoints,
	resolveRuntimeGestureSnapTargets,
	resolveStepSnapProgress,
	resolveStepSnapTargets,
} from "../../shared/snap-points";
import { determineSnapTarget } from "../../shared/targets";
import type {
	PinchGestureEvent,
	PinchGestureRuntime,
	PinchReleaseResult,
} from "../../types";

const getPinchSnapDirection = (normalizedScale: number) => {
	"worklet";
	if (normalizedScale < 0) {
		return "pinch-in";
	}

	if (normalizedScale > 0) {
		return "pinch-out";
	}

	return null;
};

const getPinchSnapVelocity = (
	event: PinchGestureEvent,
	runtime: PinchGestureRuntime,
	normalizedScale: number,
) => {
	"worklet";
	const pinchDirection = getPinchSnapDirection(normalizedScale);
	const snapDirections = runtime.policy.snapDirections;

	if (!pinchDirection || !snapDirections) {
		return 0;
	}

	return snapDirections.collapse === pinchDirection
		? Math.abs(event.velocity)
		: -Math.abs(event.velocity);
};

const getPinchSnapReleaseProgress = ({
	runtime,
	normalizedScale,
	minSnapPoint,
	maxSnapPoint,
	snapPoints,
}: {
	runtime: PinchGestureRuntime;
	normalizedScale: number;
	minSnapPoint: number;
	maxSnapPoint: number;
	snapPoints: number[];
}) => {
	"worklet";
	const pinchDirection = getPinchSnapDirection(normalizedScale);
	const snapDirections = runtime.policy.snapDirections;

	if (!pinchDirection || !snapDirections) {
		return runtime.stores.animations.transitionProgress.get();
	}

	const progressDelta =
		snapDirections.collapse === pinchDirection
			? -Math.abs(normalizedScale)
			: Math.abs(normalizedScale);
	if (runtime.policy.sheetSnapBehavior === "step") {
		return resolveStepSnapProgress({
			baseline: runtime.stores.gestures.internal.progressBaseline.get(),
			normalizedDelta: progressDelta,
			snapPoints,
		});
	}

	return clamp(
		runtime.stores.gestures.internal.progressBaseline.get() + progressDelta,
		minSnapPoint,
		maxSnapPoint,
	);
};

export const primeSnapPinchRelease = (runtime: PinchGestureRuntime) => {
	"worklet";
	primeRuntimeSnapPoint(runtime);
};

export const resolvePinchRelease = (
	event: PinchGestureEvent,
	runtime: PinchGestureRuntime,
): PinchReleaseResult => {
	"worklet";
	const {
		participation,
		policy,
		stores: { animations, system },
	} = runtime;
	const normalizedScale = clamp(normalizePinchScale(event.scale), -1, 1);
	const currentProgress = animations.transitionProgress.get();
	const shouldDismiss =
		participation.canDismiss &&
		shouldDismissFromPinch(
			normalizedScale,
			policy.pinchInEnabled,
			policy.pinchOutEnabled,
		);
	const target = shouldDismiss ? 0 : system.targetProgress.get();
	const progressVelocity = getPinchReleaseHandoffVelocity(event.velocity);
	const handoffVelocity = getPinchReleaseHandoffVelocity(
		event.velocity,
		policy.gestureReleaseVelocityScale,
	);

	return {
		target,
		shouldDismiss,
		initialVelocity: getProgressVelocityTowardTarget({
			handoffVelocity: progressVelocity,
			target,
			currentProgress,
		}),
		handoffVelocity: shouldDismiss
			? resolveGestureVelocityMagnitude(handoffVelocity)
			: 0,
		transitionSpec: policy.transitionSpec,
		resetSpec: shouldDismiss
			? policy.transitionSpec?.close
			: policy.transitionSpec?.open,
	};
};

export const resolveSnapPinchRelease = (
	event: PinchGestureEvent,
	runtime: PinchGestureRuntime,
): PinchReleaseResult => {
	"worklet";
	const { participation, policy } = runtime;
	const normalizedScale = clamp(normalizePinchScale(event.scale), -1, 1);

	const { resolvedSnapPoints, resolvedMinSnapPoint, resolvedMaxSnapPoint } =
		resolveRuntimeGestureSnapPoints(runtime);
	const allSnapTargets = resolveRuntimeGestureSnapTargets(runtime);
	const snapVelocity = getPinchSnapVelocity(event, runtime, normalizedScale);
	const pinchDirection = getPinchSnapDirection(normalizedScale);
	const progressDirection =
		pinchDirection && policy.snapDirections
			? policy.snapDirections.collapse === pinchDirection
				? -1
				: 1
			: -snapVelocity;
	const releaseSnapPoints =
		policy.sheetSnapBehavior === "step"
			? resolveStepSnapTargets({
					baseline: runtime.stores.gestures.internal.progressBaseline.get(),
					direction: progressDirection,
					snapPoints: allSnapTargets,
				})
			: resolvedSnapPoints;
	const canDismissToReleaseTarget =
		participation.canDismiss &&
		(policy.gestureSnapLocked ||
			policy.sheetSnapBehavior === "continuous" ||
			releaseSnapPoints.includes(0));
	const currentProgress = getPinchSnapReleaseProgress({
		runtime,
		normalizedScale,
		minSnapPoint: resolvedMinSnapPoint,
		maxSnapPoint: resolvedMaxSnapPoint,
		snapPoints: allSnapTargets,
	});

	const result = determineSnapTarget({
		currentProgress,
		snapPoints: policy.gestureSnapLocked
			? [
					runtime.stores.gestures.internal.lockedSnapPoint.get() ??
						resolvedMaxSnapPoint,
				]
			: releaseSnapPoints,
		velocity: snapVelocity,
		dimension: 1,
		velocityFactor: policy.gestureSnapVelocityImpact,
		canDismiss: canDismissToReleaseTarget,
	});

	const shouldDismiss = participation.canDismiss && result.shouldDismiss;
	const target = shouldDismiss ? 0 : result.targetProgress;
	const progressVelocityScale =
		policy.sheetSnapBehavior === "step" && !policy.gestureSnapLocked
			? getStepSnapProgressVelocityScale(releaseSnapPoints)
			: 1;
	const progressVelocity =
		getPinchReleaseHandoffVelocity(event.velocity) * progressVelocityScale;
	const handoffVelocity = getPinchReleaseHandoffVelocity(
		event.velocity,
		policy.gestureReleaseVelocityScale,
	);

	return {
		target,
		shouldDismiss,
		initialVelocity: getProgressVelocityTowardTarget({
			handoffVelocity: progressVelocity,
			target,
			currentProgress,
		}),
		handoffVelocity: shouldDismiss
			? resolveGestureVelocityMagnitude(handoffVelocity)
			: 0,
		commitProgress: currentProgress,
		resetValuesImmediately: true,
		transitionSpec: resolveGestureSnapTransitionSpec({
			transitionSpec: policy.transitionSpec,
			shouldDismiss,
			target,
			currentProgress,
		}),
		resetSpec: shouldDismiss
			? policy.transitionSpec?.close
			: policy.transitionSpec?.open,
	};
};
