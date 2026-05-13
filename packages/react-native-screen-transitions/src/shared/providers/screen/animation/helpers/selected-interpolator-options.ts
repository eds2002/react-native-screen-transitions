import type { SharedValue } from "react-native-reanimated";
import type { TransitionInterpolatorOptions } from "../../../../types/animation.types";

export type SelectedInterpolatorOwner = "current" | "next";

export type SelectedInterpolatorOptions = {
	owner: SelectedInterpolatorOwner;
	options?: TransitionInterpolatorOptions;
};

const areGestureDirectionsEqual = (
	left: TransitionInterpolatorOptions["gestureDirection"],
	right: TransitionInterpolatorOptions["gestureDirection"],
) => {
	"worklet";
	if (left === right) return true;
	if (!Array.isArray(left) || !Array.isArray(right)) return false;
	if (left.length !== right.length) return false;

	for (let i = 0; i < left.length; i++) {
		if (left[i] !== right[i]) {
			return false;
		}
	}

	return true;
};

const areGestureActivationAreasEqual = (
	left: TransitionInterpolatorOptions["gestureActivationArea"],
	right: TransitionInterpolatorOptions["gestureActivationArea"],
) => {
	"worklet";
	if (left === right) return true;

	if (
		typeof left !== "object" ||
		left === null ||
		typeof right !== "object" ||
		right === null
	) {
		return false;
	}

	return (
		left.left === right.left &&
		left.right === right.right &&
		left.top === right.top &&
		left.bottom === right.bottom
	);
};

const areInterpolatorOptionsEqual = (
	left?: TransitionInterpolatorOptions,
	right?: TransitionInterpolatorOptions,
) => {
	"worklet";
	if (left === right) return true;
	if (!left || !right) return false;

	return (
		left.gestureEnabled === right.gestureEnabled &&
		left.experimental_allowDisabledGestureTracking ===
			right.experimental_allowDisabledGestureTracking &&
		areGestureDirectionsEqual(left.gestureDirection, right.gestureDirection) &&
		left.gestureSensitivity === right.gestureSensitivity &&
		left.gestureVelocityImpact === right.gestureVelocityImpact &&
		left.gestureSnapVelocityImpact === right.gestureSnapVelocityImpact &&
		left.gestureReleaseVelocityScale === right.gestureReleaseVelocityScale &&
		left.gestureResponseDistance === right.gestureResponseDistance &&
		left.gestureDrivesProgress === right.gestureDrivesProgress &&
		areGestureActivationAreasEqual(
			left.gestureActivationArea,
			right.gestureActivationArea,
		) &&
		left.gestureSnapLocked === right.gestureSnapLocked &&
		left.sheetScrollGestureBehavior === right.sheetScrollGestureBehavior &&
		left.backdropBehavior === right.backdropBehavior
	);
};

export const syncSelectedInterpolatorOptions = (
	state: SharedValue<SelectedInterpolatorOptions>,
	owner: SelectedInterpolatorOwner,
	options?: TransitionInterpolatorOptions,
) => {
	"worklet";
	state.modify((current) => {
		"worklet";
		if (
			current.owner === owner &&
			areInterpolatorOptionsEqual(current.options, options)
		) {
			return current;
		}

		return options ? { owner, options } : { owner };
	}, false);
};
