import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useScreenOptionsContext } from "../../options";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type {
	DirectionClaimMap,
	GestureCompositionOwner,
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
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>;
}

export const useBuildPanGesture = ({
	scrollState,
	gestureConfig,
	childDirectionClaims,
	gestureCompositionOwner,
}: UseBuildPanGestureProps): PanGesture => {
	const dimensions = useWindowDimensions();
	const { participation, pan: policy } = gestureConfig;
	const screenOptions = useScreenOptionsContext();

	const runtime = useStableRuntimeConfig({
		participation,
		policy,
	});

	const activation = usePanActivation({
		scrollState,
		childDirectionClaims,
		runtime,
		screenOptions,
		dimensions,
		gestureCompositionOwner,
	});

	const behavior = usePanBehavior(
		runtime,
		screenOptions,
		dimensions,
		gestureCompositionOwner,
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
