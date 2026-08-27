import type { SharedValue } from "react-native-reanimated";
import type { AnimationConfig } from "../../../../types/animation.types";
import {
	animate,
	isSpringAnimationConfig,
	type SpringAnimationConfig,
} from "../../../../utils/animation/animate";

type ResetSpringSpec = SpringAnimationConfig & { velocity?: number };

type AnimateManyJob = {
	value: SharedValue<number>;
	toValue: number;
	velocity?: number;
};

const isResetSpringSpec = (spec?: AnimationConfig): spec is ResetSpringSpec => {
	"worklet";
	return isSpringAnimationConfig(spec);
};

const getGestureResetSpec = (
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

const animateResetValue = (
	value: SharedValue<number>,
	toValue: number,
	config: AnimationConfig | undefined,
	onFinished: () => void,
) => {
	"worklet";
	value.set(
		animate(toValue, config, (state) => {
			"worklet";
			if (state.finished) {
				onFinished();
			}
		}),
	);
};

export const animateMany = (
	jobs: AnimateManyJob[],
	spec: AnimationConfig | undefined,
	onFinished: () => void,
) => {
	"worklet";
	let pendingJobs = jobs.length;

	if (pendingJobs === 0) {
		onFinished();
		return;
	}

	const finishJob = () => {
		"worklet";
		pendingJobs -= 1;

		if (pendingJobs === 0) {
			onFinished();
		}
	};

	for (const job of jobs) {
		animateResetValue(
			job.value,
			job.toValue,
			getGestureResetSpec(spec, job.velocity),
			finishJob,
		);
	}
};
