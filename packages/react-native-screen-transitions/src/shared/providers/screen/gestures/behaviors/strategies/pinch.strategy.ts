import { clamp } from "react-native-reanimated";
import {
	getPinchReleaseHandoffVelocity,
	normalizePinchScale,
	shouldDismissFromPinch,
} from "../../helpers/gesture-physics";
import type { PinchBehaviorStrategy } from "../../types";

export const PinchStrategy: PinchBehaviorStrategy = {
	primeStart(_runtime) {
		"worklet";
	},

	resolveRelease(event, runtime) {
		"worklet";
		const {
			participation,
			policy,
			gestureProgressBaseline,
			stores: { animations },
		} = runtime;
		const normalizedScale = clamp(normalizePinchScale(event.scale), -1, 1);
		const currentProgress = animations.progress.get();
		const shouldDismiss =
			participation.canDismiss &&
			shouldDismissFromPinch(
				normalizedScale,
				policy.pinchInEnabled,
				policy.pinchOutEnabled,
			);
		const target = shouldDismiss ? 0 : gestureProgressBaseline.get();
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
