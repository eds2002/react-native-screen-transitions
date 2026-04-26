import { resolveSnapTransitionSpec } from "../../../../../utils/animation/resolve-snap-transition-spec";
import { getSnapPanAxisConfigForDirection } from "../../helpers/gesture-directions";
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
			config,
			policy,
			stores: { animations, system },
			lockedSnapPoint,
		} = runtime;
		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			config.effectiveSnapPoints;

		const { resolvedSnapPoints, resolvedMaxSnapPoint } =
			resolveRuntimeSnapPoints({
				snapPoints,
				hasAutoSnapPoint,
				resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
				minSnapPoint,
				maxSnapPoint,
				canDismiss: config.canDismiss,
			});

		if (policy.gestureSnapLocked) {
			lockedSnapPoint.set(
				findNearestSnapPoint(animations.progress.get(), resolvedSnapPoints),
			);
			return;
		}

		lockedSnapPoint.set(resolvedMaxSnapPoint);
	},

	resolveProgress(_event, runtime, dimensions, track) {
		"worklet";
		const {
			config,
			policy,
			stores: { system },
			gestureStartProgress,
			lockedSnapPoint,
		} = runtime;
		const activeDirection = runtime.stores.gestures.direction.get();
		const activeAxis = activeDirection
			? getSnapPanAxisConfigForDirection(policy.snapDirections, activeDirection)
			: null;

		if (!activeAxis) {
			return gestureStartProgress.get();
		}

		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			config.effectiveSnapPoints;
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
				canDismiss: config.canDismiss,
			});

		const maxProgressForGesture = policy.gestureSnapLocked
			? lockedSnapPoint.get()
			: resolvedMaxSnapPoint;
		const minProgressForGesture = policy.gestureSnapLocked
			? config.canDismiss
				? 0
				: lockedSnapPoint.get()
			: resolvedMinSnapPoint;

		return Math.max(
			minProgressForGesture,
			Math.min(
				maxProgressForGesture,
				gestureStartProgress.get() + progressDelta,
			),
		);
	},

	resolveRelease(event, runtime, dimensions) {
		"worklet";
		const {
			config,
			policy,
			stores: { animations, system },
			lockedSnapPoint,
		} = runtime;
		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			config.effectiveSnapPoints;
		const activeDirection = runtime.stores.gestures.direction.get();
		const activeAxis = activeDirection
			? getSnapPanAxisConfigForDirection(policy.snapDirections, activeDirection)
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
			canDismiss: config.canDismiss,
		});

		const result = determineSnapTarget({
			currentProgress: animations.progress.get(),
			snapPoints: policy.gestureSnapLocked
				? [lockedSnapPoint.get()]
				: resolvedSnapPoints,
			velocity: snapVelocity,
			dimension: axisDimension,
			velocityFactor: policy.gestureSnapVelocityImpact,
			canDismiss: config.canDismiss,
		});

		const shouldDismiss = result.shouldDismiss;
		const target = result.targetProgress;
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
