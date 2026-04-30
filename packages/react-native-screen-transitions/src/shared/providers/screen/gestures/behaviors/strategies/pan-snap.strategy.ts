import { resolveSnapTransitionSpec } from "../../../../../utils/animation/resolve-snap-transition-spec";
import { getPanSnapAxisConfigForDirection } from "../../helpers/gesture-directions";
import { getPanReleaseHandoffVelocity } from "../../helpers/gesture-physics";
import {
	findNearestSnapPoint,
	resolveRuntimeSnapPoints,
} from "../../helpers/gesture-snap-points";
import { determineSnapTarget } from "../../helpers/gesture-targets";
import type { PanBehaviorStrategy } from "../../types";

export const SnapPanStrategy: PanBehaviorStrategy = {
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

	resolveProgress(runtime, dimensions, track) {
		"worklet";
		const {
			participation,
			policy,
			stores: { system },
			gestureProgressBaseline,
			lockedSnapPoint,
		} = runtime;
		const activeDirection = runtime.stores.gestures.direction.get();
		const activeAxis = activeDirection
			? getPanSnapAxisConfigForDirection(
					policy.snapAxisDirections,
					activeDirection,
				)
			: null;

		if (!activeAxis) {
			return gestureProgressBaseline.get();
		}

		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			participation.effectiveSnapPoints;
		const { x, y } = track;

		const isHorizontal = activeAxis.axis === "horizontal";
		const translation = isHorizontal ? x : y;
		const dimension = isHorizontal ? dimensions.width : dimensions.height;
		const progressDelta =
			(activeAxis.config.progressSign * translation) / dimension;

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
			: resolvedMinSnapPoint;

		return Math.max(
			minProgressForGesture,
			Math.min(
				maxProgressForGesture,
				gestureProgressBaseline.get() + progressDelta,
			),
		);
	},

	resolveRelease(event, runtime, dimensions) {
		"worklet";
		const {
			participation,
			policy,
			stores: { animations, system },
			lockedSnapPoint,
		} = runtime;
		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			participation.effectiveSnapPoints;
		const activeDirection = runtime.stores.gestures.direction.get();
		const activeAxis = activeDirection
			? getPanSnapAxisConfigForDirection(
					policy.snapAxisDirections,
					activeDirection,
				)
			: null;

		if (!activeAxis) {
			return {
				target: animations.progress.get(),
				shouldDismiss: false,
				initialVelocity: 0,
				transitionSpec: policy.transitionSpec,
				resetSpec: policy.transitionSpec?.open,
			};
		}

		const isHorizontal = activeAxis.axis === "horizontal";
		const axisVelocity = isHorizontal ? event.velocityX : event.velocityY;
		const axisDimension = isHorizontal ? dimensions.width : dimensions.height;
		const snapVelocity = activeAxis.config.inverted
			? -axisVelocity
			: axisVelocity;

		const { resolvedSnapPoints } = resolveRuntimeSnapPoints({
			snapPoints,
			hasAutoSnapPoint,
			resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
			minSnapPoint,
			maxSnapPoint,
			canDismiss: participation.canDismiss,
		});

		const result = determineSnapTarget({
			currentProgress: animations.progress.get(),
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
		const isSnapping = !shouldDismiss;
		const currentProgress = animations.progress.get();
		const transitionSpec = isSnapping
			? resolveSnapTransitionSpec(
					policy.transitionSpec,
					target < currentProgress ? "collapse" : "expand",
				)
			: policy.transitionSpec;

		const snapDirection = Math.sign(target - currentProgress);
		const initialVelocity =
			snapDirection === 0
				? 0
				: snapDirection *
					Math.abs(
						getPanReleaseHandoffVelocity(
							axisVelocity,
							axisDimension,
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
