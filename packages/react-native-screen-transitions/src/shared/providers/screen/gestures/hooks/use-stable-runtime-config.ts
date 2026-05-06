import { useLayoutEffect, useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
import { useDescriptorDerivations } from "../../descriptors";
import { useScreenOptionsContext } from "../../options";
import type { PanGestureRuntime, PinchGestureRuntime } from "../types";

type StableRuntimeConfig = PanGestureRuntime | PinchGestureRuntime;
type PanRuntimeConfigInput = Omit<
	PanGestureRuntime,
	"stores" | "screenOptions"
>;
type PinchRuntimeConfigInput = Omit<
	PinchGestureRuntime,
	"stores" | "screenOptions"
>;
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

	const screenOptions = useScreenOptionsContext();

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
			screenOptions,
			gestureProgressBaseline,
			lockedSnapPoint,
		} as StableRuntimeConfig;
	}, [
		participation,
		policy,
		stores,
		screenOptions,
		gestureProgressBaseline,
		lockedSnapPoint,
	]);
	const stableRuntimeConfig = useSharedValue(runtimeConfig);

	useLayoutEffect(() => {
		stableRuntimeConfig.set(runtimeConfig);
	}, [stableRuntimeConfig, runtimeConfig]);

	return stableRuntimeConfig as
		| SharedValue<PanGestureRuntime>
		| SharedValue<PinchGestureRuntime>;
}
