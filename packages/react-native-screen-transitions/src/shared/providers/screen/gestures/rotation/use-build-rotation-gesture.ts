import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useScreenOptionsContext } from "../../options";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type {
	GestureCompositionActivation,
	RotationGesture,
	ScreenGestureConfig,
} from "../types";
import { useRotationActivation } from "./activation/use-rotation-activation";
import { useRotationBehavior } from "./behavior/use-rotation-behavior";

interface UseBuildRotationGestureProps {
	gestureConfig: ScreenGestureConfig;
	gestureCompositionActivation: SharedValue<GestureCompositionActivation>;
}

export const useBuildRotationGesture = ({
	gestureConfig,
	gestureCompositionActivation,
}: UseBuildRotationGestureProps): RotationGesture => {
	const { participation, pinch: policy } = gestureConfig;
	const screenOptions = useScreenOptionsContext();

	const runtime = useStableRuntimeConfig({
		participation,
		policy,
	});

	const activation = useRotationActivation({
		runtime,
		screenOptions,
		gestureCompositionActivation,
	});

	const behavior = useRotationBehavior(runtime, screenOptions);

	const rotationGesture = useMemo(() => {
		return Gesture.Rotation()
			.enabled(true)
			.manualActivation(true)
			.onTouchesDown(activation.onTouchesDown)
			.onTouchesMove(activation.onTouchesMove)
			.onStart(behavior.onStart)
			.onUpdate(behavior.onUpdate);
	}, [activation, behavior]);

	return rotationGesture;
};
