import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useScreenOptionsContext } from "../../options";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type {
	GestureCompositionOwner,
	PinchGesture,
	ScreenGestureConfig,
} from "../types";
import { usePinchActivation } from "./activation/use-pinch-activation";
import { usePinchBehavior } from "./behavior/use-pinch-behavior";

interface UseBuildPinchGestureProps {
	gestureConfig: ScreenGestureConfig;
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>;
}

export const useBuildPinchGesture = ({
	gestureConfig,
	gestureCompositionOwner,
}: UseBuildPinchGestureProps): PinchGesture => {
	const { participation, pinch: policy } = gestureConfig;
	const screenOptions = useScreenOptionsContext();

	const runtime = useStableRuntimeConfig({
		participation,
		policy,
	});

	const activation = usePinchActivation({
		runtime,
		screenOptions,
		gestureCompositionOwner,
	});

	const behavior = usePinchBehavior(
		runtime,
		screenOptions,
		gestureCompositionOwner,
	);

	const pinchGesture = useMemo(() => {
		return Gesture.Pinch()
			.enabled(true)
			.manualActivation(true)
			.onTouchesDown(activation.onTouchesDown)
			.onTouchesMove(activation.onTouchesMove)
			.onStart(behavior.onStart)
			.onUpdate(behavior.onUpdate)
			.onEnd(behavior.onEnd);
	}, [activation, behavior]);

	return pinchGesture;
};
