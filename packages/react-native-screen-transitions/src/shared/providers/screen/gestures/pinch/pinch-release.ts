import { clamp } from "react-native-reanimated";
import {
	getPinchReleaseHandoffVelocity,
	normalizePinchScale,
	shouldDismissFromPinch,
} from "../shared/physics";
import {
	getProgressVelocityTowardTarget,
	resolveGestureSnapTransitionSpec,
} from "../shared/release";
import {
	primeRuntimeSnapPoint,
	resolveRuntimeGestureSnapPoints,
} from "../shared/snap-points";
import { determineSnapTarget } from "../shared/targets";
import type {
	PinchGestureEvent,
	PinchGestureRuntime,
	PinchReleaseResult,
} from "../types";

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
}: {
	runtime: PinchGestureRuntime;
	normalizedScale: number;
	minSnapPoint: number;
	maxSnapPoint: number;
}) => {
	"worklet";
	const pinchDirection = getPinchSnapDirection(normalizedScale);
	const snapDirections = runtime.policy.snapDirections;

	if (!pinchDirection || !snapDirections) {
		return runtime.stores.animations.progress.get();
	}

	const progressDelta =
		snapDirections.collapse === pinchDirection
			? -Math.abs(normalizedScale)
			: Math.abs(normalizedScale);

	return clamp(
		runtime.gestureProgressBaseline.get() + progressDelta,
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
		gestureProgressBaseline,
		stores: { animations },
	} = runtime;
	const normalizedScale = clamp(normalizePinchScale(event.scale), -1, 1);
	const currentProgress = animations.progress.get();
	const shouldDismiss =
		participation.canDismiss &&
		shouldDismissFromPinch(
			normalizedScale,
			policy.pinchInEnabled,
			policy.pinchOutEnabled,
		);
	const target = shouldDismiss ? 0 : gestureProgressBaseline.get();

	return {
		target,
		shouldDismiss,
		initialVelocity: getProgressVelocityTowardTarget({
			handoffVelocity: getPinchReleaseHandoffVelocity(
				event.velocity,
				policy.gestureReleaseVelocityScale,
			),
			target,
			currentProgress,
		}),
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
	const { participation, policy, lockedSnapPoint } = runtime;
	const normalizedScale = clamp(normalizePinchScale(event.scale), -1, 1);

	const { resolvedSnapPoints, resolvedMinSnapPoint, resolvedMaxSnapPoint } =
		resolveRuntimeGestureSnapPoints(runtime);
	const currentProgress = getPinchSnapReleaseProgress({
		runtime,
		normalizedScale,
		minSnapPoint: resolvedMinSnapPoint,
		maxSnapPoint: resolvedMaxSnapPoint,
	});

	const result = determineSnapTarget({
		currentProgress,
		snapPoints: policy.gestureSnapLocked
			? [lockedSnapPoint.get()]
			: resolvedSnapPoints,
		velocity: getPinchSnapVelocity(event, runtime, normalizedScale),
		dimension: 1,
		velocityFactor: policy.gestureSnapVelocityImpact,
		canDismiss: participation.canDismiss,
	});

	const shouldDismiss = participation.canDismiss && result.shouldDismiss;
	const target = shouldDismiss ? 0 : result.targetProgress;

	return {
		target,
		shouldDismiss,
		initialVelocity: getProgressVelocityTowardTarget({
			handoffVelocity: getPinchReleaseHandoffVelocity(
				event.velocity,
				policy.gestureReleaseVelocityScale,
			),
			target,
			currentProgress,
		}),
		commitProgress: currentProgress,
		resetValuesImmediately: policy.gestureProgressMode === "progress-driven",
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
