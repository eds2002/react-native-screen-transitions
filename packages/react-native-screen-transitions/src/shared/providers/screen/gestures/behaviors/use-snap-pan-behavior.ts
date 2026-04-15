import { useCallback } from "react";
import { useWindowDimensions } from "react-native";
import type { PanGestureEvent } from "react-native-gesture-handler";
import { clamp } from "react-native-reanimated";
import { DefaultSnapSpec } from "../../../../configs/specs";
import { TRUE } from "../../../../constants";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import {
	applyGestureSensitivity,
	getPanReleaseHandoffVelocity,
	normalizeGestureTranslation,
} from "../helpers/gesture-physics";
import { resetGestureValues } from "../helpers/gesture-reset";
import {
	findNearestSnapPoint,
	resolveRuntimeSnapPoints,
} from "../helpers/gesture-snap-points";
import { determineSnapTarget } from "../helpers/gesture-targets";
import type { PanGestureRuntime } from "../types";

export const useSnapPanBehavior = ({
	config,
	policy,
	gestureStartProgress,
	lockedSnapPoint,
}: PanGestureRuntime) => {
	const { dismissScreen } = useNavigationHelpers();
	const dimensions = useWindowDimensions();

	const gestures = GestureStore.getBag(config.routeKey);
	const animations = AnimationStore.getBag(config.routeKey);
	const system = SystemStore.getBag(config.routeKey);

	const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
		config.effectiveSnapPoints;

	const onStart = useCallback(() => {
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

		animations.willAnimate.set(TRUE);
		gestures.dragging.set(TRUE);
		gestures.dismissing.set(0);
		gestureStartProgress.set(animations.progress.get());
	}, [
		config.canDismiss,
		animations,
		gestures,
		system,
		gestureStartProgress,
		policy.gestureSnapLocked,
		hasAutoSnapPoint,
		lockedSnapPoint,
		maxSnapPoint,
		minSnapPoint,
		snapPoints,
	]);

	const onUpdate = useCallback(
		(event: PanGestureEvent) => {
			"worklet";

			if (animations.willAnimate.get()) {
				animations.willAnimate.set(0);
			}

			const { translationX: rawTX, translationY: rawTY } = event;
			const { width, height } = dimensions;
			const x = applyGestureSensitivity(rawTX, policy.gestureSensitivity);
			const y = applyGestureSensitivity(rawTY, policy.gestureSensitivity);
			const normX = clamp(normalizeGestureTranslation(x, width), -1, 1);
			const normY = clamp(normalizeGestureTranslation(y, height), -1, 1);

			gestures.x.set(x);
			gestures.y.set(y);
			gestures.normX.set(normX);
			gestures.normY.set(normY);

			if (!policy.gestureDrivesProgress) {
				return;
			}

			const isHorizontal = policy.snapAxis === "horizontal";
			const translation = isHorizontal ? x : y;

			const dimension = isHorizontal ? width : height;
			const baseSign = -1;
			const sign = policy.directions.snapAxisInverted ? -baseSign : baseSign;
			const progressDelta = (sign * translation) / dimension;

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

			animations.progress.set(
				Math.max(
					minProgressForGesture,
					Math.min(
						maxProgressForGesture,
						gestureStartProgress.get() + progressDelta,
					),
				),
			);
		},
		[
			config.canDismiss,
			dimensions,
			gestureStartProgress,
			gestures,
			animations,
			hasAutoSnapPoint,
			lockedSnapPoint,
			maxSnapPoint,
			minSnapPoint,
			policy,
			snapPoints,
			system,
		],
	);

	const onEnd = useCallback(
		(event: PanGestureEvent) => {
			"worklet";

			const isHorizontal = policy.snapAxis === "horizontal";
			const axisVelocity = isHorizontal ? event.velocityX : event.velocityY;
			const axisDimension = isHorizontal ? dimensions.width : dimensions.height;
			const snapVelocity = policy.directions.snapAxisInverted
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
			const shouldTarget = result.targetProgress;

			const isSnapping = !shouldDismiss;

			const spec = shouldDismiss
				? policy.transitionSpec?.close
				: policy.transitionSpec?.open;

			const effectiveSpec = isSnapping
				? {
						open: policy.transitionSpec?.expand ?? DefaultSnapSpec,
						close: policy.transitionSpec?.collapse ?? DefaultSnapSpec,
					}
				: policy.transitionSpec;

			resetGestureValues({
				spec,
				gestures,
				shouldDismiss,
				event,
				dimensions,
				gestureReleaseVelocityScale: policy.gestureReleaseVelocityScale,
			});

			const snapDirection = Math.sign(shouldTarget - animations.progress.get());
			const initialVelocity =
				snapDirection === 0
					? 0
					: snapDirection *
						Math.abs(
							getPanReleaseHandoffVelocity(
								axisVelocity,
								axisDimension,
								policy.gestureReleaseVelocityScale,
							),
						);

			animateToProgress({
				target: shouldTarget,
				onAnimationFinish: shouldDismiss ? dismissScreen : undefined,
				spec: effectiveSpec,
				animations,
				targetProgress: system.targetProgress,
				emitWillAnimate: false,
				initialVelocity,
			});
		},
		[
			animations,
			config.canDismiss,
			dimensions,
			dismissScreen,
			gestures,
			hasAutoSnapPoint,
			lockedSnapPoint,
			maxSnapPoint,
			minSnapPoint,
			policy,
			snapPoints,
			system,
		],
	);

	return { onStart, onUpdate, onEnd };
};
