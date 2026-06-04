import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useScreenOptionsContext } from "../../options";
import { useGestureBuilderState } from "../hooks/use-gesture-builder-state";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type {
	GestureCompositionActivation,
	RotationGesture,
	ScreenGestureConfig,
} from "../types";
import { useRotationActivation } from "./rotation-activation";
import { useRotationBehavior } from "./use-rotation-behavior";

interface BuildRotationGestureHookProps {
	gestureConfig: ScreenGestureConfig;
	gestureCompositionActivation: SharedValue<GestureCompositionActivation>;
}

export const useBuildRotationGesture = ({
	gestureConfig,
	gestureCompositionActivation,
}: BuildRotationGestureHookProps): RotationGesture => {
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
