import { useCallback } from "react";
import type {
	GestureStateManager,
	GestureTouchEvent,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenOptionsContextValue } from "../../options";
import { resolvePinchRuntime } from "../helpers/runtime-options";
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
		(
			event: GestureTouchEvent,
			stateManager: GestureStateManager | undefined,
		) => {
			"worklet";
			const { participation, policy } = resolvePinchRuntime(
				runtime.get(),
				screenOptions,
			);

			if (!participation.canTrackGesture || !policy.enabled) {
				stateManager?.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				stateManager?.activate();
				return;
			}

			if (event.numberOfTouches > 2) {
				stateManager?.fail();
			}
		},
		[runtime, screenOptions],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent, stateManager: GestureStateManager) => {
			"worklet";
			const { participation, policy } = resolvePinchRuntime(
				runtime.get(),
				screenOptions,
			);

			if (!participation.canTrackGesture || !policy.enabled) {
				stateManager.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				stateManager.activate();
				return;
			}

			stateManager.fail();
		},
		[runtime, screenOptions],
	);

	return { onTouchesDown, onTouchesMove };
};
