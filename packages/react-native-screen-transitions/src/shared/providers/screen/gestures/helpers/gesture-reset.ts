import { FALSE, TRUE } from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../types/animation.types";
import { animateMany } from "../../../../utils/animation/animate-many";

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

	animateMany({
		items: [
			{
				value: gestures.x,
				toValue: 0,
				config: getGestureResetSpec(spec, velocityX),
			},
			{
				value: gestures.y,
				toValue: 0,
				config: getGestureResetSpec(spec, velocityY),
			},
			{
				value: gestures.normX,
				toValue: 0,
				config: getGestureResetSpec(spec, velocityNormX),
			},
			{
				value: gestures.normY,
				toValue: 0,
				config: getGestureResetSpec(spec, velocityNormY),
			},
		],
		onAllFinished: () => {
			"worklet";
			gestures.gesture.set(null);
			gestures.direction.set(null);
			gestures.settling.set(FALSE);
		},
	});
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

	animateMany({
		items: [
			{
				value: gestures.scale,
				toValue: 1,
				config: resetSpec,
			},
			{
				value: gestures.normScale,
				toValue: 0,
				config: resetSpec,
			},
		],
		onAllFinished: () => {
			"worklet";
			gestures.focalX.set(0);
			gestures.focalY.set(0);
			gestures.gesture.set(null);
			gestures.direction.set(null);
			gestures.settling.set(FALSE);
		},
	});
};
