import { useCallback } from "react";
import type {
	GestureStateManager,
	GestureTouchEvent,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { PinchGestureRuntime } from "../types";

interface UsePinchActivationProps {
	runtime: SharedValue<PinchGestureRuntime>;
}

export const usePinchActivation = ({ runtime }: UsePinchActivationProps) => {
	const onTouchesDown = useCallback(
		(event: GestureTouchEvent, stateManager: GestureStateManager) => {
			"worklet";
			const { config, policy } = runtime.get();

			if (!config.gestureEnabled || !policy.enabled) {
				stateManager.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				stateManager.activate();
				return;
			}

			if (event.numberOfTouches > 2) {
				stateManager.fail();
			}
		},
		[runtime],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent, stateManager: GestureStateManager) => {
			"worklet";
			const { config, policy } = runtime.get();

			if (!config.gestureEnabled || !policy.enabled) {
				stateManager.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				stateManager.activate();
				return;
			}

			stateManager.fail();
		},
		[runtime],
	);

	return { onTouchesDown, onTouchesMove };
};
