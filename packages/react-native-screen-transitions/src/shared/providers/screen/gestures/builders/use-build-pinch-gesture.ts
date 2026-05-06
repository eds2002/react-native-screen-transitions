import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useScreenOptionsContext } from "../../options";
import { usePinchActivation } from "../activation/use-pinch-activation";
import { usePinchBehavior } from "../behaviors/use-pinch-behavior";
import { useGestureBuilderState } from "../hooks/use-gesture-builder-state";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type { PinchGesture, ScreenGestureConfig } from "../types";

interface BuildPinchGestureHookProps {
	gestureConfig: ScreenGestureConfig;
}

export const useBuildPinchGesture = ({
	gestureConfig,
}: BuildPinchGestureHookProps): PinchGesture => {
	const { participation, pinch: policy } = gestureConfig;
	const screenOptions = useScreenOptionsContext();
	const { gestureProgressBaseline, lockedSnapPoint } =
		useGestureBuilderState(participation);

	const runtime = useStableRuntimeConfig({
		participation,
		policy,
		gestureProgressBaseline,
		lockedSnapPoint,
	});

	const activation = usePinchActivation({
		runtime,
		screenOptions,
	});

	const behavior = usePinchBehavior(runtime, screenOptions);

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
