import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenOptionsContextValue } from "../../options/types";
import { useStableRuntimeConfig } from "../ownership/hooks/use-stable-runtime-config";
import type {
	GestureCompositionOwner,
	GestureOwnerMap,
	PanGesture,
	ScreenGestureConfig,
	ScrollGestureState,
} from "../types";
import { usePanActivation } from "./activation/use-pan-activation";
import { usePanBehavior } from "./behavior/use-pan-behavior";

interface UseBuildPanGestureProps {
	onDismissRequest?: () => void;
	screenOptions: ScreenOptionsContextValue;
	scrollState: SharedValue<ScrollGestureState | null>;
	gestureConfig: ScreenGestureConfig;
	gestureOwners: SharedValue<GestureOwnerMap>;
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>;
}

export const useBuildPanGesture = ({
	onDismissRequest,
	screenOptions,
	scrollState,
	gestureConfig,
	gestureOwners,
	gestureCompositionOwner,
}: UseBuildPanGestureProps): PanGesture => {
	const dimensions = useWindowDimensions();
	const { participation, pan: policy } = gestureConfig;

	const runtime = useStableRuntimeConfig({
		participation,
		policy,
	});

	const activation = usePanActivation({
		scrollState,
		gestureOwners,
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
		activation.pendingDirection,
		onDismissRequest,
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
