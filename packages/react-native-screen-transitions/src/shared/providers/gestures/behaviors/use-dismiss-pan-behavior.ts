import { useCallback } from "react";
import { useWindowDimensions } from "react-native";
import type { PanGestureEvent } from "react-native-gesture-handler";
import { clamp } from "react-native-reanimated";
import { TRUE } from "../../../constants";
import { useNavigationHelpers } from "../../../hooks/navigation/use-navigation-helpers";
import { AnimationStore } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import { SystemStore } from "../../../stores/system.store";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import {
	applyGestureSensitivity,
	getPanReleaseProgressVelocity,
	mapGestureToProgress,
	normalizeGestureTranslation,
} from "../helpers/gesture-physics";
import { resetGestureValues } from "../helpers/gesture-reset";
import { determineDismissal } from "../helpers/gesture-targets";
import type { PanGestureRuntime } from "../types";

export const useDismissPanBehavior = ({
	config,
	policy,
	gestureStartProgress,
}: PanGestureRuntime) => {
	const { dismissScreen } = useNavigationHelpers();
	const dimensions = useWindowDimensions();

	const gestures = GestureStore.getBag(config.routeKey);
	const animations = AnimationStore.getBag(config.routeKey);
	const system = SystemStore.getBag(config.routeKey);

	const onStart = useCallback(() => {
		"worklet";
		animations.willAnimate.set(TRUE);
		gestures.dragging.set(TRUE);
		gestures.dismissing.set(0);
		gestureStartProgress.set(animations.progress.get());
	}, [gestureStartProgress, animations, gestures]);

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

			let maxProgress = 0;

			if (policy.directions.horizontal && x > 0) {
				maxProgress = Math.max(maxProgress, mapGestureToProgress(x, width));
			}

			if (policy.directions.horizontalInverted && x < 0) {
				maxProgress = Math.max(maxProgress, mapGestureToProgress(-x, width));
			}

			if (policy.directions.vertical && y > 0) {
				maxProgress = Math.max(maxProgress, mapGestureToProgress(y, height));
			}

			if (policy.directions.verticalInverted && y < 0) {
				maxProgress = Math.max(maxProgress, mapGestureToProgress(-y, height));
			}

			animations.progress.set(
				clamp(gestureStartProgress.get() - maxProgress, 0, 1),
			);
		},
		[dimensions, gestureStartProgress, animations, gestures, policy],
	);

	const onEnd = useCallback(
		(event: PanGestureEvent) => {
			"worklet";

			const result = determineDismissal({
				event,
				directions: policy.directions,
				dimensions,
				gestureVelocityImpact: policy.gestureVelocityImpact,
			});

			const shouldDismiss = result.shouldDismiss;
			const adjustedTargetProgress = shouldDismiss ? 0 : 1;
			const initialVelocity = getPanReleaseProgressVelocity({
				animations,
				shouldDismiss,
				event,
				dimensions,
				directions: policy.directions,
				gestureReleaseVelocityScale: policy.gestureReleaseVelocityScale,
			});

			resetGestureValues({
				spec: shouldDismiss
					? policy.transitionSpec?.close
					: policy.transitionSpec?.open,
				gestures,
				shouldDismiss,
				event,
				dimensions,
				gestureReleaseVelocityScale: policy.gestureReleaseVelocityScale,
			});

			animateToProgress({
				target: adjustedTargetProgress,
				onAnimationFinish: shouldDismiss ? dismissScreen : undefined,
				spec: policy.transitionSpec,
				emitWillAnimate: false,
				targetProgress: system.targetProgress,
				animations,
				initialVelocity,
			});
		},
		[animations, dimensions, dismissScreen, gestures, policy, system],
	);

	return { onStart, onUpdate, onEnd };
};
