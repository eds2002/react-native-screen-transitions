import { useLayoutEffect, useMemo } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
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
	const {
		config,
		policy,
		runtimeOverrides,
		gestureStartProgress,
		lockedSnapPoint,
	} = runtimeConfigInput;

	const stores = useMemo(() => {
		return {
			gestures: GestureStore.getBag(config.routeKey),
			animations: AnimationStore.getBag(config.routeKey),
			system: SystemStore.getBag(config.routeKey),
		};
	}, [config.routeKey]);

	const runtimeConfig = useMemo<StableRuntimeConfig>(() => {
		return {
			config,
			policy,
			stores,
			runtimeOverrides,
			gestureStartProgress,
			lockedSnapPoint,
		} as StableRuntimeConfig;
	}, [
		config,
		policy,
		stores,
		runtimeOverrides,
		gestureStartProgress,
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
