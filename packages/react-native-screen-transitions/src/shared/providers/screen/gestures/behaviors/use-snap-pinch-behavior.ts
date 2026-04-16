import { useCallback } from "react";
import type { PinchGestureEvent } from "react-native-gesture-handler";
import { clamp } from "react-native-reanimated";
import { DefaultSnapSpec } from "../../../../configs/specs";
import { FALSE, TRUE } from "../../../../constants";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../utils/animation/emit";
import {
	applyGestureSensitivity,
	getPinchReleaseHandoffVelocity,
	normalizePinchScale,
} from "../helpers/gesture-physics";
import { resetPinchGestureValues } from "../helpers/gesture-reset";
import {
	findNearestSnapPoint,
	resolveRuntimeSnapPoints,
} from "../helpers/gesture-snap-points";
import { determineSnapTarget } from "../helpers/gesture-targets";
import type { PinchGestureRuntime } from "../types";

export const useSnapPinchBehavior = ({
	config,
	policy,
	stores: { gestures, animations, system },
	gestureStartProgress,
	lockedSnapPoint,
}: PinchGestureRuntime) => {
	const { dismissScreen } = useNavigationHelpers();
	const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
		config.effectiveSnapPoints;

	const onStart = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";

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
			} else {
				lockedSnapPoint.set(resolvedMaxSnapPoint);
			}

			emit(animations.willAnimate, TRUE, FALSE);
			gestures.dragging.set(TRUE);
			gestures.dismissing.set(0);
			gestures.direction.set(null);
			gestures.scale.set(1);
			gestures.normScale.set(0);
			gestures.focalX.set(event.focalX);
			gestures.focalY.set(event.focalY);
			gestureStartProgress.set(animations.progress.get());
		},
		[
			animations.progress,
			animations.willAnimate,
			config.canDismiss,
			gestureStartProgress,
			gestures.dismissing,
			gestures.direction,
			gestures.dragging,
			gestures.focalX,
			gestures.focalY,
			gestures.normScale,
			gestures.scale,
			hasAutoSnapPoint,
			lockedSnapPoint,
			maxSnapPoint,
			minSnapPoint,
			policy.gestureSnapLocked,
			snapPoints,
			system.resolvedAutoSnapPoint,
		],
	);

	const onUpdate = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";

			const normScale = clamp(
				applyGestureSensitivity(
					normalizePinchScale(event.scale),
					policy.gestureSensitivity,
				),
				-1,
				1,
			);
			const scale = clamp(1 + normScale, 0, 2);

			gestures.scale.set(scale);
			gestures.normScale.set(normScale);
			gestures.focalX.set(event.focalX);
			gestures.focalY.set(event.focalY);

			if (!policy.gestureDrivesProgress) {
				return;
			}

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

			animations.progress.set(
				clamp(
					gestureStartProgress.get() + progressDelta,
					minProgressForGesture,
					maxProgressForGesture,
				),
			);
		},
		[
			animations.progress,
			config.canDismiss,
			gestureStartProgress,
			gestures.focalX,
			gestures.focalY,
			gestures.normScale,
			gestures.scale,
			hasAutoSnapPoint,
			lockedSnapPoint,
			maxSnapPoint,
			minSnapPoint,
			policy.gestureDrivesProgress,
			policy.gestureSensitivity,
			policy.gestureSnapLocked,
			policy.pinchInEnabled,
			policy.pinchOutEnabled,
			snapPoints,
			system.resolvedAutoSnapPoint,
		],
	);

	const onEnd = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";

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
			const shouldTarget = result.targetProgress;
			const isSnapping = !shouldDismiss;
			const effectiveSpec = isSnapping
				? {
						open: policy.transitionSpec?.expand ?? DefaultSnapSpec,
						close: policy.transitionSpec?.collapse ?? DefaultSnapSpec,
					}
				: policy.transitionSpec;

			const progressDirection = Math.sign(shouldTarget - currentProgress);
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

			resetPinchGestureValues({
				spec: shouldDismiss
					? policy.transitionSpec?.close
					: policy.transitionSpec?.open,
				gestures: gestures,
				shouldDismiss,
			});

			animateToProgress({
				target: shouldTarget,
				onAnimationFinish: shouldDismiss ? dismissScreen : undefined,
				spec: effectiveSpec,
				animations: animations,
				targetProgress: system.targetProgress,
				emitWillAnimate: false,
				initialVelocity,
			});
		},
		[
			animations,
			config.canDismiss,
			dismissScreen,
			gestures,
			hasAutoSnapPoint,
			lockedSnapPoint,
			maxSnapPoint,
			minSnapPoint,
			policy.gestureReleaseVelocityScale,
			policy.gestureSensitivity,
			policy.gestureSnapLocked,
			policy.gestureSnapVelocityImpact,
			policy.pinchInEnabled,
			policy.pinchOutEnabled,
			policy.transitionSpec,
			snapPoints,
			system.resolvedAutoSnapPoint,
			system.targetProgress,
		],
	);

	return { onStart, onUpdate, onEnd };
};
