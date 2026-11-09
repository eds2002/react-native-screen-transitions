import { FALSE, TRUE } from "../../../../../constants";
import type {
	MotionAnimationValues,
	MotionGestureValues,
} from "../../../types";
import { animateMany } from "../../shared/reset";
import {
	clearPanProgressDeltaValues,
	clearRawPanValues,
} from "../../shared/values";
import type { PanReleasePlan } from "../../types";

interface ResetPanGestureValuesProps {
	plan: PanReleasePlan;
	values: MotionGestureValues & MotionAnimationValues;
	completeMotion?: boolean;
	updateLifecycle?: boolean;
}

export const resetPanGestureValues = ({
	plan,
	values,
	completeMotion = false,
	updateLifecycle = true,
}: ResetPanGestureValuesProps) => {
	"worklet";
	const finishPanReset = () => {
		"worklet";
		if (!updateLifecycle || plan.shouldDismiss) {
			return;
		}

		values.initiator.set(null);
		values.settling.set(FALSE);
		if (completeMotion) {
			values.progressAnimating.set(FALSE);
			values.progressSettled.set(TRUE);
		}
	};

	if (updateLifecycle && !plan.shouldDismiss) {
		values.progressAnimating.set(TRUE);
		values.progressSettled.set(FALSE);
	}

	clearRawPanValues(values);

	if (updateLifecycle) {
		values.dragging.set(FALSE);
		values.dismissing.set(plan.shouldDismiss ? TRUE : FALSE);
		values.settling.set(plan.shouldDismiss ? FALSE : TRUE);
	}

	values.velocity.set(0);

	const progressDeltaWasCommitted = typeof plan.commitProgress === "number";

	if (progressDeltaWasCommitted) {
		clearPanProgressDeltaValues(values);
	}

	animateMany(
		[
			{ value: values.x, toValue: 0, velocity: plan.resetVelocityX },
			{ value: values.y, toValue: 0, velocity: plan.resetVelocityY },
			{ value: values.normX, toValue: 0, velocity: plan.resetVelocityNormX },
			{ value: values.normY, toValue: 0, velocity: plan.resetVelocityNormY },
			...(progressDeltaWasCommitted
				? []
				: [
						{
							value: values.internal.progressDeltaX,
							toValue: 0,
							velocity: plan.resetVelocityNormX,
						},
						{
							value: values.internal.progressDeltaY,
							toValue: 0,
							velocity: plan.resetVelocityNormY,
						},
					]),
		],
		plan.resetSpec,
		finishPanReset,
	);
};
