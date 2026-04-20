import { clamp } from "react-native-reanimated";
import { DefaultSnapSpec } from "../../../../../configs/specs";
import {
	applyGestureSensitivity,
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
	primeStart(runtime, _event) {
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

	resolveProgress(_event, runtime, track) {
		"worklet";
		const {
			config,
			policy,
			stores: { system },
			gestureStartProgress,
			lockedSnapPoint,
		} = runtime;
		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			config.effectiveSnapPoints;
		const { normScale } = track;

		const progressDelta =
			(normScale < 0 && policy.pinchInEnabled) ||
			(normScale > 0 && policy.pinchOutEnabled)
				? normScale
				: 0;

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
			: config.canDismiss
				? 0
				: resolvedMinSnapPoint;

		return clamp(
			gestureStartProgress.get() + progressDelta,
			minProgressForGesture,
			maxProgressForGesture,
		);
	},

	resolveRelease(event, runtime) {
		"worklet";
		const {
			config,
			policy,
			stores: { animations, system },
			lockedSnapPoint,
		} = runtime;
		const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
			config.effectiveSnapPoints;
		const normalizedScale = clamp(
			applyGestureSensitivity(
				normalizePinchScale(event.scale),
				policy.gestureSensitivity,
			),
			-1,
			1,
		);
		const currentProgress = animations.progress.get();

		const { resolvedSnapPoints } = resolveRuntimeSnapPoints({
			snapPoints,
			hasAutoSnapPoint,
			resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
			minSnapPoint,
			maxSnapPoint,
			canDismiss: config.canDismiss,
		});

		let snapVelocity = 0;
		if (normalizedScale < 0 && policy.pinchInEnabled) {
			snapVelocity = Math.abs(event.velocity);
		} else if (normalizedScale > 0 && policy.pinchOutEnabled) {
			snapVelocity = -Math.abs(event.velocity);
		}

		const result = determineSnapTarget({
			currentProgress,
			snapPoints: policy.gestureSnapLocked
				? [lockedSnapPoint.get()]
				: resolvedSnapPoints,
			velocity: snapVelocity,
			dimension: 1,
			velocityFactor: policy.gestureSnapVelocityImpact,
			canDismiss: config.canDismiss,
		});

		const shouldDismiss = result.shouldDismiss;
		const target = result.targetProgress;
		const isSnapping = !shouldDismiss;
		const transitionSpec = isSnapping
			? {
					open: policy.transitionSpec?.expand ?? DefaultSnapSpec,
					close: policy.transitionSpec?.collapse ?? DefaultSnapSpec,
				}
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
