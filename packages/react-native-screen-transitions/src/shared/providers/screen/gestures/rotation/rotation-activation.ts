import { useCallback, useMemo } from "react";
import type {
	GestureStateManager,
	GestureTouchEvent,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenOptionsContextValue } from "../../options";
import { resolvePinchRuntime } from "../shared/runtime";
import type {
	GestureCompositionActivation,
	RotationGestureRuntime,
} from "../types";

interface UseRotationActivationProps {
	runtime: SharedValue<RotationGestureRuntime>;
	screenOptions: ScreenOptionsContextValue;
	gestureCompositionActivation: SharedValue<GestureCompositionActivation>;
}

export const useRotationActivation = ({
	runtime,
	screenOptions,
	gestureCompositionActivation,
}: UseRotationActivationProps) => {
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

			if (gestureCompositionActivation.get() === "pan") {
				stateManager?.fail();
				return;
			}

			if (!participation.canTrackGesture || !policy.enabled) {
				stateManager?.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				gestureCompositionActivation.set("pinch");
				stateManager?.activate();
				return;
			}

			if (event.numberOfTouches > 2) {
				stateManager?.fail();
			}
		},
		[runtime, screenOptions, gestureCompositionActivation],
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
				gestureCompositionActivation.set("pinch");
				stateManager.activate();
				return;
			}

			stateManager.fail();
		},
		[runtime, screenOptions, gestureCompositionActivation],
	);

	return useMemo(
		() => ({ onTouchesDown, onTouchesMove }),
		[onTouchesDown, onTouchesMove],
	);
};
