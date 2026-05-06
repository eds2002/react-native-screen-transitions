import { useLayoutEffect, useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
import { useDescriptorDerivations } from "../../descriptors";
import type { PanGestureRuntime, PinchGestureRuntime } from "../types";

type StableRuntimeConfig = PanGestureRuntime | PinchGestureRuntime;
type PanRuntimeConfigInput = Omit<PanGestureRuntime, "stores">;
type PinchRuntimeConfigInput = Omit<PinchGestureRuntime, "stores">;
type StableRuntimeConfigInput = PanRuntimeConfigInput | PinchRuntimeConfigInput;

export function useStableRuntimeConfig(
	runtimeConfigInput: PanRuntimeConfigInput,
): SharedValue<PanGestureRuntime>;
export function useStableRuntimeConfig(
	runtimeConfigInput: PinchRuntimeConfigInput,
): SharedValue<PinchGestureRuntime>;
export function useStableRuntimeConfig(
	runtimeConfigInput: StableRuntimeConfigInput,
): SharedValue<PanGestureRuntime> | SharedValue<PinchGestureRuntime> {
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

	const runtimeConfig = useMemo<StableRuntimeConfig>(() => {
		return {
			participation,
			policy,
			stores,
			gestureProgressBaseline,
			lockedSnapPoint,
		} as StableRuntimeConfig;
	}, [participation, policy, stores, gestureProgressBaseline, lockedSnapPoint]);
	const stableRuntimeConfig = useSharedValue(runtimeConfig);

	useLayoutEffect(() => {
		stableRuntimeConfig.set(runtimeConfig);
	}, [stableRuntimeConfig, runtimeConfig]);

	return stableRuntimeConfig as
		| SharedValue<PanGestureRuntime>
		| SharedValue<PinchGestureRuntime>;
}
