import { useLayoutEffect, useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
import { useDescriptorDerivations } from "../../descriptors";
import type { GesturePolicy, GestureRuntime } from "../types";

type RuntimeConfigInput<TPolicy extends GesturePolicy> = Omit<
	GestureRuntime<TPolicy>,
	"stores"
>;

export function useStableRuntimeConfig<TPolicy extends GesturePolicy>(
	runtimeConfigInput: RuntimeConfigInput<TPolicy>,
): SharedValue<GestureRuntime<TPolicy>> {
	const { currentScreenKey } = useDescriptorDerivations();
	const { participation, policy, gestureProgressBaseline, lockedSnapPoint } =
		runtimeConfigInput;

	const stores = useMemo(() => {
		return {
			gestures: GestureStore.getBag(currentScreenKey),
			animations: AnimationStore.getBag(currentScreenKey),
			system: SystemStore.getBag(currentScreenKey),
		};
	}, [currentScreenKey]);

	const runtimeConfig = useMemo<GestureRuntime<TPolicy>>(() => {
		return {
			participation,
			policy,
			stores,
			gestureProgressBaseline,
			lockedSnapPoint,
		};
	}, [participation, policy, stores, gestureProgressBaseline, lockedSnapPoint]);
	const stableRuntimeConfig = useSharedValue(runtimeConfig);

	useLayoutEffect(() => {
		stableRuntimeConfig.set(runtimeConfig);
	}, [stableRuntimeConfig, runtimeConfig]);

	return stableRuntimeConfig;
}
