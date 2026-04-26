import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { usePinchActivation } from "../activation/use-pinch-activation";
import { usePinchBehavior } from "../behaviors/use-pinch-behavior";
import { usePinchPolicy } from "../config/use-pinch-policy";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type {
	GestureRuntimeOverrides,
	PinchGesture,
	ScreenGestureConfig,
} from "../types";

interface BuildPinchGestureHookProps {
	config: ScreenGestureConfig;
	runtimeOverrides: GestureRuntimeOverrides;
}

export const useBuildPinchGesture = ({
	config,
	runtimeOverrides,
}: BuildPinchGestureHookProps): PinchGesture => {
	const gestureStartProgress = useSharedValue(1);
	const lockedSnapPoint = useSharedValue(
		config.effectiveSnapPoints.maxSnapPoint,
	);

	const policy = usePinchPolicy(config);

	const runtime = useStableRuntimeConfig({
		config,
		policy,
		runtimeOverrides,
		gestureStartProgress,
		lockedSnapPoint,
	});

	const activation = usePinchActivation({
		runtime,
	});

	const behavior = usePinchBehavior(runtime);

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
