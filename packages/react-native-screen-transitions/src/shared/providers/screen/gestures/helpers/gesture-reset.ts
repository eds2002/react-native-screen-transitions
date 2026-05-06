import { FALSE, TRUE } from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../types/animation.types";
import { animateMany } from "../../../../utils/animation/animate-many";

interface ResetGestureValuesProps {
	spec?: AnimationConfig;
	gestures: GestureStoreMap;
	shouldDismiss: boolean;
}

const getGestureResetSpec = (
	spec?: AnimationConfig,
): AnimationConfig | undefined => {
	"worklet";

	if (!spec || !("velocity" in spec)) {
		return spec;
	}

	const { velocity: _velocity, ...resetSpec } = spec;
	return resetSpec as AnimationConfig;
};

export const resetGestureValues = ({
	spec,
	gestures,
	shouldDismiss,
}: ResetGestureValuesProps) => {
	"worklet";
	const resetSpec = getGestureResetSpec(spec);

	gestures.raw.x.set(0);
	gestures.raw.y.set(0);
	gestures.raw.normX.set(0);
	gestures.raw.normY.set(0);

	animateMany({
		items: [
			{
				value: gestures.x,
				toValue: 0,
				config: resetSpec,
			},
			{
				value: gestures.y,
				toValue: 0,
				config: resetSpec,
			},
			{
				value: gestures.normX,
				toValue: 0,
				config: resetSpec,
			},
			{
				value: gestures.normY,
				toValue: 0,
				config: resetSpec,
			},
		],
		onAllFinished: () => {
			"worklet";
			gestures.gesture.set(null);
			gestures.direction.set(null);
		},
	});

	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
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
		},
	});

	gestures.dragging.set(FALSE);
	gestures.dismissing.set(shouldDismiss ? TRUE : FALSE);
};
