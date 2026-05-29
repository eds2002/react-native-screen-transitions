import { useMemo } from "react";
import { usePinchGesture } from "react-native-gesture-handler";
import { useScreenOptionsStore } from "../../options";
import { useGestureBuilderState } from "../hooks/use-gesture-builder-state";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type { PinchGesture, ScreenGestureConfig } from "../types";
import { usePinchActivation } from "./pinch-activation";
import { usePinchBehavior } from "./use-pinch-behavior";

interface BuildPinchGestureHookProps {
	gestureConfig: ScreenGestureConfig;
}

export const useBuildPinchGesture = ({
	gestureConfig,
}: BuildPinchGestureHookProps): PinchGesture => {
	const { participation, pinch: policy } = gestureConfig;
	const screenOptions = useScreenOptionsStore((store) => store);
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

	const pinchGestureConfig = useMemo(
		() => ({
			enabled: true,
			manualActivation: true,
			onTouchesDown: activation.onTouchesDown,
			onTouchesMove: activation.onTouchesMove,
			onActivate: behavior.onStart,
			onUpdate: behavior.onUpdate,
			onDeactivate: behavior.onEnd,
		}),
		[activation, behavior],
	);

	const pinchGesture = usePinchGesture(pinchGestureConfig);

	return pinchGesture;
};
