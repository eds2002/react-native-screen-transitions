import { useLayoutEffect, useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import type { MotionValues } from "../../../types";
import type { GesturePolicy, GestureRuntime } from "../../types";

type RuntimeConfigInput<TPolicy extends GesturePolicy> = Omit<
	GestureRuntime<TPolicy>,
	"values"
>;

export function useStableRuntimeConfig<TPolicy extends GesturePolicy>(
	runtimeConfigInput: RuntimeConfigInput<TPolicy>,
	values: MotionValues,
): SharedValue<GestureRuntime<TPolicy>> {
	const { participation, policy } = runtimeConfigInput;

	const runtimeConfig = useMemo<GestureRuntime<TPolicy>>(() => {
		return {
			participation,
			policy,
			values,
		};
	}, [participation, policy, values]);
	const stableRuntimeConfig = useSharedValue(runtimeConfig);

	useLayoutEffect(() => {
		stableRuntimeConfig.set(runtimeConfig);
	}, [stableRuntimeConfig, runtimeConfig]);

	return stableRuntimeConfig;
}
