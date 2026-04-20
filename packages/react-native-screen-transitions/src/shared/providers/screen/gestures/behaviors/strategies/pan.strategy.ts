import { clamp } from "react-native-reanimated";
import {
	getPanReleaseProgressVelocity,
	mapGestureToProgress,
} from "../../helpers/gesture-physics";
import { determineDismissal } from "../../helpers/gesture-targets";
import type { PanBehaviorStrategy } from "../../types";

export const PanStrategy: PanBehaviorStrategy = {
	primeStart(_runtime) {
		"worklet";
	},

	resolveProgress(_event, runtime, dimensions, track) {
		"worklet";
		const { policy, gestureStartProgress } = runtime;
		const { x, y } = track;
		const { width, height } = dimensions;

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

		return clamp(gestureStartProgress.get() - maxProgress, 0, 1);
	},

	resolveRelease(event, runtime, dimensions) {
		"worklet";
		const {
			policy,
			stores: { animations },
		} = runtime;

		const result = determineDismissal({
			event,
			directions: policy.directions,
			dimensions,
			gestureVelocityImpact: policy.gestureVelocityImpact,
		});

		const shouldDismiss = result.shouldDismiss;

		return {
			target: shouldDismiss ? 0 : 1,
			shouldDismiss,
			initialVelocity: getPanReleaseProgressVelocity({
				animations,
				shouldDismiss,
				event,
				dimensions,
				directions: policy.directions,
				gestureReleaseVelocityScale: policy.gestureReleaseVelocityScale,
			}),
			transitionSpec: policy.transitionSpec,
			resetSpec: shouldDismiss
				? policy.transitionSpec?.close
				: policy.transitionSpec?.open,
		};
	},
};
