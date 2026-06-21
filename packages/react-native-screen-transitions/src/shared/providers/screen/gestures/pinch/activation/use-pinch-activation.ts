import { useCallback, useMemo } from "react";
import type {
	GestureStateManager,
	GestureTouchEvent,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenOptionsContextValue } from "../../../options";
import { resolvePinchRuntime } from "../../shared/runtime";
import type { GestureCompositionOwner, PinchGestureRuntime } from "../../types";

interface UsePinchActivationProps {
	runtime: SharedValue<PinchGestureRuntime>;
	screenOptions: ScreenOptionsContextValue;
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>;
}

export const usePinchActivation = ({
	runtime,
	screenOptions,
	gestureCompositionOwner,
}: UsePinchActivationProps) => {
	const onTouchesDown = useCallback(
		(
			event: GestureTouchEvent,
			stateManager: GestureStateManager | undefined,
		) => {
			"worklet";
			const { participation, policy } = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);

			if (!participation.canTrackGesture || !policy.enabled) {
				stateManager?.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				if (gestureCompositionOwner.get() === null) {
					gestureCompositionOwner.set("pinch");
				}
				stateManager?.activate();
				return;
			}

			if (event.numberOfTouches > 2) {
				stateManager?.fail();
			}
		},
		[runtime, screenOptions, gestureCompositionOwner],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent, stateManager: GestureStateManager) => {
			"worklet";
			const { participation, policy } = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);

			if (!participation.canTrackGesture || !policy.enabled) {
				stateManager.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				if (gestureCompositionOwner.get() === null) {
					gestureCompositionOwner.set("pinch");
				}
				stateManager.activate();
				return;
			}

			if (event.numberOfTouches > 2) {
				stateManager.fail();
			}
		},
		[runtime, screenOptions, gestureCompositionOwner],
	);

	return useMemo(
		() => ({ onTouchesDown, onTouchesMove }),
		[onTouchesDown, onTouchesMove],
	);
};
