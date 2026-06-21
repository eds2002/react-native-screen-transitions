import { FALSE, TRUE } from "../../../../../constants";
import type { GestureStoreMap } from "../../../../../stores/gesture.store";
import { animateMany } from "../../shared/reset";
import {
	clearPanProgressDeltaValues,
	clearRawPanValues,
} from "../../shared/values";
import type { PanReleasePlan } from "../../types";

interface ResetPanGestureValuesProps {
	plan: PanReleasePlan;
	gestures: GestureStoreMap;
	updateLifecycle?: boolean;
}

export const resetPanGestureValues = ({
	plan,
	gestures,
	updateLifecycle = true,
}: ResetPanGestureValuesProps) => {
	"worklet";
	const finishPanReset = () => {
		"worklet";
		if (!updateLifecycle || plan.shouldDismiss) {
			return;
		}

		gestures.active.set(null);
		gestures.direction.set(null);
		gestures.settling.set(FALSE);
	};

	clearRawPanValues(gestures);

	if (updateLifecycle) {
		gestures.dragging.set(FALSE);
		gestures.dismissing.set(plan.shouldDismiss ? TRUE : FALSE);
		gestures.settling.set(plan.shouldDismiss ? FALSE : TRUE);
	}

	gestures.velocity.set(0);

	const progressDeltaWasCommitted = typeof plan.commitProgress === "number";

	if (progressDeltaWasCommitted) {
		clearPanProgressDeltaValues(gestures);
	}

	animateMany(
		[
			{ value: gestures.x, toValue: 0, velocity: plan.resetVelocityX },
			{ value: gestures.y, toValue: 0, velocity: plan.resetVelocityY },
			{ value: gestures.normX, toValue: 0, velocity: plan.resetVelocityNormX },
			{ value: gestures.normY, toValue: 0, velocity: plan.resetVelocityNormY },
			...(progressDeltaWasCommitted
				? []
				: [
						{
							value: gestures.internal.progressDeltaX,
							toValue: 0,
							velocity: plan.resetVelocityNormX,
						},
						{
							value: gestures.internal.progressDeltaY,
							toValue: 0,
							velocity: plan.resetVelocityNormY,
						},
					]),
		],
		plan.resetSpec,
		finishPanReset,
	);
};
