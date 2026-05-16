import { clamp } from "react-native-reanimated";
import {
	getPanSnapAxisConfigForDirection,
	isResolvedPanGestureDirection,
} from "../shared/directions";
import {
	getPanReleaseHandoffVelocity,
	getPanReleaseProgressVelocity,
	resolveGestureVelocity,
} from "../shared/physics";
import {
	getProgressVelocityTowardTarget,
	resolveGestureSnapTransitionSpec,
} from "../shared/release";
import {
	primeRuntimeSnapPoint,
	resolveRuntimeGestureSnapPoints,
} from "../shared/snap-points";
import { determineDismissal, determineSnapTarget } from "../shared/targets";
import type {
	GestureDimensions,
	PanGestureEvent,
	PanGestureRuntime,
	PanReleasePlan,
	PanReleaseResult,
} from "../types";

const resolvePanReleaseVelocity = (
	runtime: PanGestureRuntime,
	velocityNormX: number,
	velocityNormY: number,
) => {
	"worklet";
	const activeGesture = runtime.stores.gestures.active.get();

	switch (activeGesture) {
		case "horizontal":
		case "horizontal-inverted":
			return resolveGestureVelocity(velocityNormX, 0);
		case "vertical":
		case "vertical-inverted":
			return resolveGestureVelocity(0, velocityNormY);
		default:
			return resolveGestureVelocity(velocityNormX, velocityNormY);
	}
};

const resolveActivePanSnapAxis = (runtime: PanGestureRuntime) => {
	"worklet";
	const activeGesture = runtime.stores.gestures.active.get();

	return isResolvedPanGestureDirection(activeGesture)
		? getPanSnapAxisConfigForDirection(
				runtime.policy.snapAxisDirections,
				activeGesture,
			)
		: null;
};

const getPanSnapAxisMotion = (
	event: PanGestureEvent,
	dimensions: GestureDimensions,
	activeAxis: NonNullable<ReturnType<typeof resolveActivePanSnapAxis>>,
) => {
	"worklet";
	const isHorizontal = activeAxis.axis === "horizontal";
	const axisVelocity = isHorizontal ? event.velocityX : event.velocityY;
	const axisDimension = isHorizontal ? dimensions.width : dimensions.height;
	const snapVelocity = activeAxis.config.inverted
		? -axisVelocity
		: axisVelocity;

	return { axisVelocity, axisDimension, snapVelocity };
};

const getPanSnapReleaseProgress = ({
	runtime,
	event,
	dimensions,
	activeAxis,
	minSnapPoint,
	maxSnapPoint,
}: {
	runtime: PanGestureRuntime;
	event: PanGestureEvent;
	dimensions: GestureDimensions;
	activeAxis: NonNullable<ReturnType<typeof resolveActivePanSnapAxis>>;
	minSnapPoint: number;
	maxSnapPoint: number;
}) => {
	"worklet";
	const isHorizontal = activeAxis.axis === "horizontal";
	const axisTranslation = isHorizontal
		? event.translationX
		: event.translationY;
	const axisDimension = isHorizontal ? dimensions.width : dimensions.height;
	const axisProgress = axisTranslation / Math.max(1, axisDimension);
	const progress =
		runtime.gestureProgressBaseline.get() +
		activeAxis.config.progressSign * axisProgress;

	return clamp(progress, minSnapPoint, maxSnapPoint);
};

const buildInactivePanSnapRelease = (
	runtime: PanGestureRuntime,
): PanReleaseResult => {
	"worklet";
	const { policy, stores } = runtime;

	return {
		target: stores.animations.progress.get(),
		shouldDismiss: false,
		initialVelocity: 0,
		transitionSpec: policy.transitionSpec,
		resetSpec: policy.transitionSpec?.open,
	};
};

export const primeSnapPanRelease = (runtime: PanGestureRuntime) => {
	"worklet";
	primeRuntimeSnapPoint(runtime);
};

export const resolvePanRelease = (
	event: PanGestureEvent,
	runtime: PanGestureRuntime,
	dimensions: GestureDimensions,
): PanReleaseResult => {
	"worklet";
	const {
		participation,
		policy,
		stores: { animations },
	} = runtime;

	const result = determineDismissal({
		event,
		directions: policy.panActivationDirections,
		dimensions,
		gestureVelocityImpact: policy.gestureVelocityImpact,
	});

	const shouldDismiss = participation.canDismiss && result.shouldDismiss;

	return {
		target: shouldDismiss ? 0 : 1,
		shouldDismiss,
		initialVelocity: getPanReleaseProgressVelocity({
			animations,
			shouldDismiss,
			event,
			dimensions,
			directions: policy.panActivationDirections,
			gestureReleaseVelocityScale: policy.gestureReleaseVelocityScale,
		}),
		transitionSpec: policy.transitionSpec,
		resetSpec: shouldDismiss
			? policy.transitionSpec?.close
			: policy.transitionSpec?.open,
	};
};

export const resolveSnapPanRelease = (
	event: PanGestureEvent,
	runtime: PanGestureRuntime,
	dimensions: GestureDimensions,
): PanReleaseResult => {
	"worklet";
	const { participation, policy, lockedSnapPoint } = runtime;
	const activeAxis = resolveActivePanSnapAxis(runtime);

	if (!activeAxis) {
		return buildInactivePanSnapRelease(runtime);
	}

	const { axisVelocity, axisDimension, snapVelocity } = getPanSnapAxisMotion(
		event,
		dimensions,
		activeAxis,
	);
	const { resolvedSnapPoints, resolvedMinSnapPoint, resolvedMaxSnapPoint } =
		resolveRuntimeGestureSnapPoints(runtime);
	const currentProgress = getPanSnapReleaseProgress({
		runtime,
		event,
		dimensions,
		activeAxis,
		minSnapPoint: resolvedMinSnapPoint,
		maxSnapPoint: resolvedMaxSnapPoint,
	});
	const result = determineSnapTarget({
		currentProgress,
		snapPoints: policy.gestureSnapLocked
			? [lockedSnapPoint.get()]
			: resolvedSnapPoints,
		velocity: snapVelocity,
		dimension: axisDimension,
		velocityFactor: policy.gestureSnapVelocityImpact,
		canDismiss: participation.canDismiss,
	});

	const shouldDismiss = participation.canDismiss && result.shouldDismiss;
	const target = shouldDismiss ? 0 : result.targetProgress;

	return {
		target,
		shouldDismiss,
		initialVelocity: getProgressVelocityTowardTarget({
			handoffVelocity: getPanReleaseHandoffVelocity(
				axisVelocity,
				axisDimension,
				policy.gestureReleaseVelocityScale,
			),
			target,
			currentProgress,
		}),
		commitProgress: currentProgress,
		resetNormalizedValuesImmediately:
			policy.gestureProgressMode === "progress-driven",
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

export const buildPanReleasePlan = (
	release: PanReleaseResult,
	runtime: PanGestureRuntime,
	dimensions: GestureDimensions,
	rawEvent: PanGestureEvent,
): PanReleasePlan => {
	"worklet";
	const { policy } = runtime;
	const progressDriven = policy.gestureProgressMode === "progress-driven";
	const releaseVelocityScale = Math.max(0, policy.gestureReleaseVelocityScale);
	const resetUsesReleaseVelocity = !release.shouldDismiss || !progressDriven;
	const resetVelocityFactor = resetUsesReleaseVelocity ? 1 : 0;
	const resetVelocityScale = releaseVelocityScale * resetVelocityFactor;
	const resetVelocityX =
		resetVelocityScale === 0 ? 0 : rawEvent.velocityX * resetVelocityScale;
	const resetVelocityY =
		resetVelocityScale === 0 ? 0 : rawEvent.velocityY * resetVelocityScale;
	const releaseVelocityNormX =
		rawEvent.velocityX / Math.max(1, dimensions.width);
	const releaseVelocityNormY =
		rawEvent.velocityY / Math.max(1, dimensions.height);
	const releaseVelocity = release.shouldDismiss
		? resolvePanReleaseVelocity(
				runtime,
				releaseVelocityNormX,
				releaseVelocityNormY,
			)
		: 0;

	return {
		target: release.target,
		shouldDismiss: release.shouldDismiss,
		progressVelocity: progressDriven ? release.initialVelocity : 0,
		resetVelocityX,
		resetVelocityY,
		resetVelocityNormX: resetVelocityX / Math.max(1, dimensions.width),
		resetVelocityNormY: resetVelocityY / Math.max(1, dimensions.height),
		releaseVelocity,
		resetNormalizedValues: !release.shouldDismiss || progressDriven,
		resetNormalizedValuesImmediately:
			release.resetNormalizedValuesImmediately === true,
		preserveRawValues: release.shouldDismiss,
		commitProgress: release.commitProgress,
		transitionSpec: release.transitionSpec,
		resetSpec: release.resetSpec,
	};
};
