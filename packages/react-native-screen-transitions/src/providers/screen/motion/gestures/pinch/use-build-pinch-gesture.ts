import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenOptionsContextValue } from "../../options/types";
import { useStableRuntimeConfig } from "../ownership/hooks/use-stable-runtime-config";
import type {
	GestureCompositionOwner,
	PinchGesture,
	ScreenGestureConfig,
} from "../types";
import { usePinchActivation } from "./activation/use-pinch-activation";
import { usePinchBehavior } from "./behavior/use-pinch-behavior";

interface UseBuildPinchGestureProps {
	onDismissRequest?: () => void;
	screenOptions: ScreenOptionsContextValue;
	gestureConfig: ScreenGestureConfig;
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>;
}

export const useBuildPinchGesture = ({
	onDismissRequest,
	screenOptions,
	gestureConfig,
	gestureCompositionOwner,
}: UseBuildPinchGestureProps): PinchGesture => {
	const { participation, pinch: policy } = gestureConfig;

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
		onDismissRequest,
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
