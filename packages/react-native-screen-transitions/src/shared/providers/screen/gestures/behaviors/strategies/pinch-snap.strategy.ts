import { clamp } from "react-native-reanimated";
import { resolveSnapTransitionSpec } from "../../../../../utils/animation/resolve-snap-transition-spec";
import {
	getPinchReleaseHandoffVelocity,
	normalizePinchScale,
} from "../../helpers/gesture-physics";
import {
	findNearestSnapPoint,
	resolveRuntimeSnapPoints,
} from "../../helpers/gesture-snap-points";
import { determineSnapTarget } from "../../helpers/gesture-targets";
import type { PinchBehaviorStrategy } from "../../types";

export const SnapPinchStrategy: PinchBehaviorStrategy = {
	primeStart(runtime) {
		"worklet";
		const {
			participation,
			policy,
			stores: { animations, system },
			lockedSnapPoint,
		} = runtime;
		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			participation.effectiveSnapPoints;

		const { resolvedSnapPoints, resolvedMaxSnapPoint } =
			resolveRuntimeSnapPoints({
				snapPoints,
				hasAutoSnapPoint,
				resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
				minSnapPoint,
				maxSnapPoint,
				canDismiss: participation.canDismiss,
			});

		if (policy.gestureSnapLocked) {
			lockedSnapPoint.set(
				findNearestSnapPoint(animations.progress.get(), resolvedSnapPoints),
			);
			return;
		}

		lockedSnapPoint.set(resolvedMaxSnapPoint);
	},

	resolveProgress(runtime, track) {
		"worklet";
		const {
			participation,
			policy,
			stores: { system },
			gestureProgressBaseline,
			lockedSnapPoint,
		} = runtime;
		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			participation.effectiveSnapPoints;
		const { normScale } = track;
		const pinchDirection =
			normScale < 0 ? "pinch-in" : normScale > 0 ? "pinch-out" : null;

		let progressDelta = 0;
		if (pinchDirection && policy.snapDirections) {
			progressDelta =
				policy.snapDirections.collapse === pinchDirection
					? -Math.abs(normScale)
					: Math.abs(normScale);
		}

		const { resolvedMinSnapPoint, resolvedMaxSnapPoint } =
			resolveRuntimeSnapPoints({
				snapPoints,
				hasAutoSnapPoint,
				resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
				minSnapPoint,
				maxSnapPoint,
				canDismiss: participation.canDismiss,
			});

		const maxProgressForGesture = policy.gestureSnapLocked
			? lockedSnapPoint.get()
			: resolvedMaxSnapPoint;

		const minProgressForGesture = policy.gestureSnapLocked
			? participation.canDismiss
				? 0
				: lockedSnapPoint.get()
			: participation.canDismiss
				? 0
				: resolvedMinSnapPoint;

		return clamp(
			gestureProgressBaseline.get() + progressDelta,
			minProgressForGesture,
			maxProgressForGesture,
		);
	},

	resolveRelease(event, runtime) {
		"worklet";
		const {
			participation,
			policy,
			stores: { animations, system },
			lockedSnapPoint,
		} = runtime;
		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			participation.effectiveSnapPoints;
		const normalizedScale = clamp(normalizePinchScale(event.scale), -1, 1);
		const currentProgress = animations.progress.get();
		const pinchDirection =
			normalizedScale < 0
				? "pinch-in"
				: normalizedScale > 0
					? "pinch-out"
					: null;

		const { resolvedSnapPoints } = resolveRuntimeSnapPoints({
			snapPoints,
			hasAutoSnapPoint,
			resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
			minSnapPoint,
			maxSnapPoint,
			canDismiss: participation.canDismiss,
		});

		let snapVelocity = 0;
		if (pinchDirection && policy.snapDirections) {
			snapVelocity =
				policy.snapDirections.collapse === pinchDirection
					? Math.abs(event.velocity)
					: -Math.abs(event.velocity);
		}

		const result = determineSnapTarget({
			currentProgress,
			snapPoints: policy.gestureSnapLocked
				? [lockedSnapPoint.get()]
				: resolvedSnapPoints,
			velocity: snapVelocity,
			dimension: 1,
			velocityFactor: policy.gestureSnapVelocityImpact,
			canDismiss: participation.canDismiss,
		});

		const shouldDismiss = participation.canDismiss && result.shouldDismiss;
		const target = shouldDismiss ? 0 : result.targetProgress;
		const isSnapping = !shouldDismiss;
		const transitionSpec = isSnapping
			? resolveSnapTransitionSpec(
					policy.transitionSpec,
					target < currentProgress ? "collapse" : "expand",
				)
			: policy.transitionSpec;
		const progressDirection = Math.sign(target - currentProgress);
		const initialVelocity =
			progressDirection === 0
				? 0
				: progressDirection *
					Math.abs(
						getPinchReleaseHandoffVelocity(
							event.velocity,
							policy.gestureReleaseVelocityScale,
							policy.gestureReleaseVelocityMax,
						),
					);

		return {
			target,
			shouldDismiss,
			initialVelocity,
			transitionSpec,
			resetSpec: shouldDismiss
				? policy.transitionSpec?.close
				: policy.transitionSpec?.open,
		};
	},
};
