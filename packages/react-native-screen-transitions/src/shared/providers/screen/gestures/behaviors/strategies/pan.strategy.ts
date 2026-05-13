import { getPanReleaseProgressVelocity } from "../../helpers/gesture-physics";
import { determineDismissal } from "../../helpers/gesture-targets";
import type { PanBehaviorStrategy } from "../../types";

export const PanStrategy: PanBehaviorStrategy = {
	primeStart(_runtime) {
		"worklet";
	},

	resolveRelease(event, runtime, dimensions) {
		"worklet";
		const {
			participation,
			policy,
			stores: { animations },
		} = runtime;

		const result = determineDismissal({
			event,
			directions: policy.panActivationDirections,
			dimensions,
			gestureVelocityImpact: policy.gestureVelocityImpact,
		});

		const shouldDismiss = participation.canDismiss && result.shouldDismiss;

		return {
			target: shouldDismiss ? 0 : 1,
			shouldDismiss,
			initialVelocity: getPanReleaseProgressVelocity({
				animations,
				shouldDismiss,
				event,
				dimensions,
				directions: policy.panActivationDirections,
				gestureReleaseVelocityScale: policy.gestureReleaseVelocityScale,
				gestureReleaseVelocityMax: policy.gestureReleaseVelocityMax,
			}),
			transitionSpec: policy.transitionSpec,
			resetSpec: shouldDismiss
				? policy.transitionSpec?.close
				: policy.transitionSpec?.open,
		};
	},
};
