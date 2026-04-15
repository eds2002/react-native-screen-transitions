import { useCallback } from "react";
import type { PinchGestureEvent } from "react-native-gesture-handler";
import { clamp } from "react-native-reanimated";
import { TRUE } from "../../../../constants";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import {
	applyGestureSensitivity,
	getPinchReleaseHandoffVelocity,
	normalizePinchScale,
	shouldDismissFromPinch,
} from "../helpers/gesture-physics";
import { resetPinchGestureValues } from "../helpers/gesture-reset";
import type { PinchGestureRuntime } from "../types";

export const useDismissPinchBehavior = ({
	config,
	policy,
	gestureStartProgress,
}: PinchGestureRuntime) => {
	const { dismissScreen } = useNavigationHelpers();

	const gestures = GestureStore.getBag(config.routeKey);
	const animations = AnimationStore.getBag(config.routeKey);
	const system = SystemStore.getBag(config.routeKey);

	const onStart = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";
			animations.willAnimate.set(TRUE);
			gestures.dragging.set(TRUE);
			gestures.dismissing.set(0);
			gestures.direction.set(null);
			gestures.scale.set(1);
			gestures.normScale.set(0);
			gestures.focalX.set(event.focalX);
			gestures.focalY.set(event.focalY);
			gestureStartProgress.set(animations.progress.get());
		},
		[gestureStartProgress, animations, gestures],
	);

	const onUpdate = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";

			if (animations.willAnimate.get()) {
				animations.willAnimate.set(0);
			}

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
					? Math.abs(normScale)
					: 0;

			animations.progress.set(
				clamp(
					gestureStartProgress.get() - progressDelta,
					0,
					gestureStartProgress.get(),
				),
			);
		},
		[animations, gestureStartProgress, gestures, policy],
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
			const shouldDismiss = shouldDismissFromPinch(
				normalizedScale,
				policy.pinchInEnabled,
				policy.pinchOutEnabled,
			);
			const shouldTarget = shouldDismiss ? 0 : gestureStartProgress.get();
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
				gestures,
				shouldDismiss,
			});

			animateToProgress({
				target: shouldTarget,
				onAnimationFinish: shouldDismiss ? dismissScreen : undefined,
				spec: policy.transitionSpec,
				emitWillAnimate: false,
				animations,
				targetProgress: system.targetProgress,
				initialVelocity,
			});
		},
		[animations, dismissScreen, gestureStartProgress, gestures, policy, system],
	);

	return { onStart, onUpdate, onEnd };
};
