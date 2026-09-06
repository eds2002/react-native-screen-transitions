import { useLayoutEffect, useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { useBuilderStore } from "../../../../builder";
import type { MotionValues } from "../../../types";
import type { GesturePolicy, GestureRuntime } from "../../types";

type RuntimeConfigInput<TPolicy extends GesturePolicy> = Omit<
	GestureRuntime<TPolicy>,
	"stores"
>;

export function useStableRuntimeConfig<TPolicy extends GesturePolicy>(
	runtimeConfigInput: RuntimeConfigInput<TPolicy>,
	values: MotionValues,
): SharedValue<GestureRuntime<TPolicy>> {
	const system = useBuilderStore((store) => store.animationState);
	const { participation, policy } = runtimeConfigInput;

	const stores = useMemo(() => {
		return {
			gestures: values,
			animations: values,
			system,
		};
	}, [values, system]);

	const runtimeConfig = useMemo<GestureRuntime<TPolicy>>(() => {
		return {
			participation,
			policy,
			stores,
		};
	}, [participation, policy, stores]);
	const stableRuntimeConfig = useSharedValue(runtimeConfig);

	useLayoutEffect(() => {
		stableRuntimeConfig.set(runtimeConfig);
	}, [stableRuntimeConfig, runtimeConfig]);

	return stableRuntimeConfig;
}
