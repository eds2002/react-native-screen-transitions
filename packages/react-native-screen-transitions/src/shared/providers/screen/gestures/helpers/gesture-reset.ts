import type { SharedValue } from "react-native-reanimated";
import { EPSILON, FALSE, TRUE } from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../types/animation.types";
import { animate } from "../../../../utils/animation/animate";

interface ResetGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
	velocityX?: number;
	velocityY?: number;
	velocityNormX?: number;
	velocityNormY?: number;
}

const getGestureResetSpec = (
	spec?: AnimationConfig,
	velocity?: number,
): AnimationConfig | undefined => {
	"worklet";

	const isSpring =
		typeof spec === "object" && !("duration" in spec) && !("easing" in spec);

	if (!isSpring) {
		return spec;
	}

	const { velocity: _velocity, ...resetSpec } = spec as AnimationConfig & {
		velocity?: number;
	};
	return (
		typeof velocity === "number" ? { ...resetSpec, velocity } : resetSpec
	) as AnimationConfig;
};

const animateResetValue = (
	value: SharedValue<number>,
	toValue: number,
	config: AnimationConfig | undefined,
	onFinished: () => void,
) => {
	"worklet";
	value.set(
		animate(toValue, config, (finished) => {
			"worklet";
			if (finished) {
				onFinished();
			}
		}),
	);
};

const clearPanSettlingIfResting = (gestures: GestureStoreMap) => {
	"worklet";

	if (
		gestures.dragging.get() ||
		gestures.dismissing.get() ||
		Math.abs(gestures.x.get()) > EPSILON ||
		Math.abs(gestures.y.get()) > EPSILON ||
		Math.abs(gestures.normX.get()) > EPSILON ||
		Math.abs(gestures.normY.get()) > EPSILON
	) {
		return;
	}

	gestures.active.set(null);
	gestures.direction.set(null);
	gestures.settling.set(FALSE);
};

const clearPinchSettlingIfResting = (gestures: GestureStoreMap) => {
	"worklet";

	if (
		gestures.dragging.get() ||
		gestures.dismissing.get() ||
		Math.abs(gestures.scale.get() - 1) > EPSILON ||
		Math.abs(gestures.normScale.get()) > EPSILON
	) {
		return;
	}

	gestures.focalX.set(0);
	gestures.focalY.set(0);
	gestures.active.set(null);
	gestures.direction.set(null);
	gestures.settling.set(FALSE);
};

export const resetGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
	velocityX,
	velocityY,
	velocityNormX,
	velocityNormY,
}: ResetGestureValuesProps) => {
	"worklet";

	gestures.raw.x.set(0);
	gestures.raw.y.set(0);
	gestures.raw.normX.set(0);
	gestures.raw.normY.set(0);
	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
	gestures.settling.set(shouldDismiss ? FALSE : TRUE);

	animateResetValue(gestures.x, 0, getGestureResetSpec(spec, velocityX), () =>
		clearPanSettlingIfResting(gestures),
	);
	animateResetValue(gestures.y, 0, getGestureResetSpec(spec, velocityY), () =>
		clearPanSettlingIfResting(gestures),
	);
	animateResetValue(
		gestures.normX,
		0,
		getGestureResetSpec(spec, velocityNormX),
		() => clearPanSettlingIfResting(gestures),
	);
	animateResetValue(
		gestures.normY,
		0,
		getGestureResetSpec(spec, velocityNormY),
		() => clearPanSettlingIfResting(gestures),
	);
};

interface ResetPinchGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
}

export const resetPinchGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
}: ResetPinchGestureValuesProps) => {
	"worklet";
	const resetSpec = getGestureResetSpec(spec);

	gestures.raw.scale.set(1);
	gestures.raw.normScale.set(0);
	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
	gestures.settling.set(shouldDismiss ? FALSE : TRUE);

	animateResetValue(gestures.scale, 1, resetSpec, () =>
		clearPinchSettlingIfResting(gestures),
	);
	animateResetValue(gestures.normScale, 0, resetSpec, () =>
		clearPinchSettlingIfResting(gestures),
	);
};
