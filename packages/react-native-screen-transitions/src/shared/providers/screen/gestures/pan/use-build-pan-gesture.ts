import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useScreenOptionsContext } from "../../options";
import { useGestureBuilderState } from "../hooks/use-gesture-builder-state";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type {
	DirectionClaimMap,
	GestureCompositionActivation,
	PanGesture,
	ScreenGestureConfig,
	ScrollGestureState,
} from "../types";
import { usePanActivation } from "./activation/use-pan-activation";
import { usePanBehavior } from "./behavior/use-pan-behavior";

interface UseBuildPanGestureProps {
	scrollState: SharedValue<ScrollGestureState | null>;
	gestureConfig: ScreenGestureConfig;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	gestureCompositionActivation: SharedValue<GestureCompositionActivation>;
}

export const useBuildPanGesture = ({
	scrollState,
	gestureConfig,
	childDirectionClaims,
	gestureCompositionActivation,
}: UseBuildPanGestureProps): PanGesture => {
	const dimensions = useWindowDimensions();
	const { participation, pan: policy } = gestureConfig;
	const screenOptions = useScreenOptionsContext();

	const { gestureProgressBaseline, lockedSnapPoint } =
		useGestureBuilderState(participation);

	const runtime = useStableRuntimeConfig({
		participation,
		policy,
		gestureProgressBaseline,
		lockedSnapPoint,
	});

	const activation = usePanActivation({
		scrollState,
		childDirectionClaims,
		runtime,
		screenOptions,
		dimensions,
		gestureCompositionActivation,
	});

	const behavior = usePanBehavior(
		runtime,
		screenOptions,
		dimensions,
		gestureCompositionActivation,
	);

	const panGesture = useMemo(() => {
		return Gesture.Pan()
			.enabled(true)
			.manualActivation(true)
			.averageTouches(true)
			.onTouchesDown(activation.onTouchesDown)
			.onTouchesMove(activation.onTouchesMove)
			.onStart(behavior.onStart)
			.onUpdate(behavior.onUpdate)
			.onEnd(behavior.onEnd);
	}, [activation, behavior]);

	return panGesture;
};
