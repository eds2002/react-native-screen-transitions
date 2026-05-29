import { useCallback, useMemo } from "react";
import {
	GestureStateManager,
	type GestureTouchEvent,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenOptionsContextValue } from "../../options";
import { resolvePinchRuntime } from "../shared/runtime";
import type { PinchGestureRuntime } from "../types";

interface UsePinchActivationProps {
	runtime: SharedValue<PinchGestureRuntime>;
	screenOptions: ScreenOptionsContextValue;
}

export const usePinchActivation = ({
	runtime,
	screenOptions,
}: UsePinchActivationProps) => {
	const onTouchesDown = useCallback(
		(event: GestureTouchEvent) => {
			"worklet";
			const { participation, policy } = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);

			if (!participation.canTrackGesture || !policy.enabled) {
				GestureStateManager.fail(event.handlerTag);
				return;
			}

			if (event.numberOfTouches === 2) {
				GestureStateManager.activate(event.handlerTag);
				return;
			}

			if (event.numberOfTouches > 2) {
				GestureStateManager.fail(event.handlerTag);
			}
		},
		[runtime, screenOptions],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent) => {
			"worklet";
			const { participation, policy } = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);

			if (!participation.canTrackGesture || !policy.enabled) {
				GestureStateManager.fail(event.handlerTag);
				return;
			}

			if (event.numberOfTouches === 2) {
				GestureStateManager.activate(event.handlerTag);
				return;
			}

			GestureStateManager.fail(event.handlerTag);
		},
		[runtime, screenOptions],
	);

	return useMemo(
		() => ({ onTouchesDown, onTouchesMove }),
		[onTouchesDown, onTouchesMove],
	);
};
