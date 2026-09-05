import { useLayoutEffect, useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../../../../stores/animation.store";
import { GestureStore } from "../../../../../../stores/gesture.store";
import { useBuilderStore } from "../../../../builder";
import type { GesturePolicy, GestureRuntime } from "../../types";

type RuntimeConfigInput<TPolicy extends GesturePolicy> = Omit<
	GestureRuntime<TPolicy>,
	"stores"
>;

export function useStableRuntimeConfig<TPolicy extends GesturePolicy>(
	runtimeConfigInput: RuntimeConfigInput<TPolicy>,
): SharedValue<GestureRuntime<TPolicy>> {
	const currentScreenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const system = useBuilderStore((store) => store.animationState);
	const { participation, policy } = runtimeConfigInput;

	const stores = useMemo(() => {
		return {
			gestures: GestureStore.getBag(currentScreenKey),
			animations: AnimationStore.getBag(currentScreenKey),
			system,
		};
	}, [currentScreenKey, system]);

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
