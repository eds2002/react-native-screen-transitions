import type { SharedValue } from "react-native-reanimated";
import { FALSE } from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { AnimationConfig } from "../../../../types/animation.types";
import { animate } from "../../../../utils/animation/animate";

type ResetSpringSpec = AnimationConfig & { velocity?: number };

const isResetSpringSpec = (spec?: AnimationConfig): spec is ResetSpringSpec => {
	"worklet";
	if (typeof spec !== "object") {
		return false;
	}

	if ("duration" in spec) {
		return false;
	}

	if ("easing" in spec) {
		return false;
	}

	return true;
};

export const getGestureResetSpec = (
	spec?: AnimationConfig,
	velocity?: number,
): AnimationConfig | undefined => {
	"worklet";

	if (!isResetSpringSpec(spec)) {
		return spec;
	}

	const { velocity: _velocity, ...resetSpec } = spec;

	if (typeof velocity !== "number") {
		return resetSpec;
	}

	return { ...resetSpec, velocity };
};

export const animateResetValue = (
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

export const clearGestureSettlingIfResting = (
	gestures: GestureStoreMap,
	isResting: boolean,
) => {
	"worklet";
	if (!isResting) {
		return;
	}

	gestures.active.set(null);
	gestures.direction.set(null);
	gestures.settling.set(FALSE);
};
