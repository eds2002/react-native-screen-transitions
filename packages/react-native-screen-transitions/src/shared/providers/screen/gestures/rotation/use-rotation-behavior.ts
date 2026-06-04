import { useCallback, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenOptionsContextValue } from "../../options";
import { resolvePinchRuntime } from "../shared/runtime";
import type {
	RotationBehavior,
	RotationGestureEvent,
	RotationGestureRuntime,
} from "../types";
import {
	startRotationGesture,
	trackRotationGesture,
} from "./rotation-lifecycle";

export const useRotationBehavior = (
	runtime: SharedValue<RotationGestureRuntime>,
	screenOptions: ScreenOptionsContextValue,
): RotationBehavior => {
	const onStart = useCallback(() => {
		"worklet";
		const latestRuntime = resolvePinchRuntime(
			runtime.get(),
			screenOptions.get(),
		);
		startRotationGesture(latestRuntime.stores.gestures);
	}, [runtime, screenOptions]);

	const onUpdate = useCallback(
		(rawEvent: RotationGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			trackRotationGesture(rawEvent, rawEvent, latestRuntime.stores.gestures);
		},
		[runtime, screenOptions],
	);

	return useMemo(
		() => ({
			onStart,
			onUpdate,
		}),
		[onStart, onUpdate],
	);
};
