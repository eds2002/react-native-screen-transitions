import { useWindowDimensions } from "react-native";
import type {
	GestureStateChangeEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { TRUE } from "../../../constants";
import { useNavigationHelpers } from "../../../hooks/navigation/use-navigation-helpers";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import { clampVelocity } from "../helpers/gesture-directions";
import {
	calculateProgressSpringVelocity,
	mapGestureToProgress,
	normalizeGestureTranslation,
} from "../helpers/gesture-physics";
import { resetGestureValues } from "../helpers/gesture-reset";
import { determineDismissal } from "../helpers/gesture-targets";
import type { PanGestureRuntime } from "../types";

export const useDismissPanBehavior = ({
	policy,
	stores,
	gestureStartProgress,
}: PanGestureRuntime) => {
	const { dismissScreen } = useNavigationHelpers();
	const dimensions = useWindowDimensions();
	const onStart = useStableCallbackValue(() => {
		"worklet";
		stores.animations.willAnimate.value = TRUE;
		stores.gestureAnimationValues.dragging.value = TRUE;
		stores.gestureAnimationValues.dismissing.value = 0;
		gestureStartProgress.value = stores.animations.progress.value;
	});

	const onUpdate = useStableCallbackValue(
		(event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			if (stores.animations.willAnimate.value) {
				stores.animations.willAnimate.value = 0;
			}

			const { translationX, translationY } = event;
			const { width, height } = dimensions;

			stores.gestureAnimationValues.x.value = translationX;
			stores.gestureAnimationValues.y.value = translationY;
			stores.gestureAnimationValues.normX.value = normalizeGestureTranslation(
				translationX,
				width,
			);
			stores.gestureAnimationValues.normY.value = normalizeGestureTranslation(
				translationY,
				height,
			);

			if (!policy.gestureDrivesProgress) {
				return;
			}

			let maxProgress = 0;

			if (policy.directions.horizontal && translationX > 0) {
				maxProgress = Math.max(
					maxProgress,
					mapGestureToProgress(translationX, width),
				);
			}

			if (policy.directions.horizontalInverted && translationX < 0) {
				maxProgress = Math.max(
					maxProgress,
					mapGestureToProgress(-translationX, width),
				);
			}

			if (policy.directions.vertical && translationY > 0) {
				maxProgress = Math.max(
					maxProgress,
					mapGestureToProgress(translationY, height),
				);
			}

			if (policy.directions.verticalInverted && translationY < 0) {
				maxProgress = Math.max(
					maxProgress,
					mapGestureToProgress(-translationY, height),
				);
			}

			stores.animations.progress.value = Math.max(
				0,
				Math.min(1, gestureStartProgress.value - maxProgress),
			);
		},
	);

	const onEnd = useStableCallbackValue(
		(event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			stores.animations.willAnimate.value = 0;

			const result = determineDismissal({
				event,
				directions: policy.directions,
				dimensions,
				gestureVelocityImpact: policy.gestureVelocityImpact,
			});

			const shouldDismiss = result.shouldDismiss;
			const targetProgress = shouldDismiss ? 0 : 1;

			resetGestureValues({
				spec: shouldDismiss
					? policy.transitionSpec?.close
					: policy.transitionSpec?.open,
				gestures: stores.gestureAnimationValues,
				shouldDismiss,
				event,
				dimensions,
				gestureReleaseVelocityScale: policy.gestureReleaseVelocityScale,
				gestureReleaseVelocityMax: policy.gestureReleaseVelocityMax,
			});

			const initialVelocity = calculateProgressSpringVelocity({
				animations: stores.animations,
				shouldDismiss,
				event,
				dimensions,
				directions: policy.directions,
			});

			const scaledInitialVelocity = clampVelocity(
				initialVelocity * policy.gestureReleaseVelocityScale,
				policy.gestureReleaseVelocityMax,
			);

			animateToProgress({
				target: targetProgress,
				onAnimationFinish: shouldDismiss ? dismissScreen : undefined,
				spec: policy.transitionSpec,
				animations: stores.animations,
				targetProgress: stores.targetProgressValue,
				emitWillAnimate: false,
				// initialVelocity: scaledInitialVelocity,
			});
		},
	);

	return { onStart, onUpdate, onEnd };
};
