import { clamp } from "react-native-reanimated";
import {
	getPinchReleaseHandoffVelocity,
	normalizePinchScale,
	shouldDismissFromPinch,
} from "../../helpers/gesture-physics";
import type { PinchBehaviorStrategy } from "../../types";

export const PinchStrategy: PinchBehaviorStrategy = {
	primeStart(_runtime, _event) {
		"worklet";
	},

	resolveProgress(_event, runtime, track) {
		"worklet";
		const { policy, gestureStartProgress } = runtime;
		const { normScale } = track;

		const progressDelta =
			(normScale < 0 && policy.pinchInEnabled) ||
			(normScale > 0 && policy.pinchOutEnabled)
				? Math.abs(normScale)
				: 0;

		return clamp(
			gestureStartProgress.get() - progressDelta,
			0,
			gestureStartProgress.get(),
		);
	},

	resolveRelease(event, runtime) {
		"worklet";
		const {
			policy,
			gestureStartProgress,
			stores: { animations },
		} = runtime;
		const normalizedScale = clamp(normalizePinchScale(event.scale), -1, 1);
		const currentProgress = animations.progress.get();
		const shouldDismiss = shouldDismissFromPinch(
			normalizedScale,
			policy.pinchInEnabled,
			policy.pinchOutEnabled,
		);
		const target = shouldDismiss ? 0 : gestureStartProgress.get();
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
			transitionSpec: policy.transitionSpec,
			resetSpec: shouldDismiss
				? policy.transitionSpec?.close
				: policy.transitionSpec?.open,
		};
	},
};
