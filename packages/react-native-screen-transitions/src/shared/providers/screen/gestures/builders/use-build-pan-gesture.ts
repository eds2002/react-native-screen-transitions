import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { usePanActivation } from "../activation/use-pan-activation";
import { usePanBehavior } from "../behaviors/use-pan-behavior";
import { useGestureBuilderState } from "../hooks/use-gesture-builder-state";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type {
	DirectionClaimMap,
	GestureRuntimeOverrides,
	PanGesture,
	ScreenGestureConfig,
	ScrollGestureState,
} from "../types";

interface BuildPanGestureHookProps {
	scrollState: SharedValue<ScrollGestureState | null>;
	gestureConfig: ScreenGestureConfig;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	runtimeOverrides: GestureRuntimeOverrides;
}

export const useBuildPanGesture = ({
	scrollState,
	gestureConfig,
	childDirectionClaims,
	runtimeOverrides,
}: BuildPanGestureHookProps): PanGesture => {
	const dimensions = useWindowDimensions();
	const { participation, pan: policy } = gestureConfig;

	const { gestureProgressBaseline, lockedSnapPoint } =
		useGestureBuilderState(participation);

	const runtime = useStableRuntimeConfig({
		participation,
		policy,
		runtimeOverrides,
		gestureProgressBaseline,
		lockedSnapPoint,
	});

	const activation = usePanActivation({
		scrollState,
		childDirectionClaims,
		runtime,
		dimensions,
	});

	const behavior = usePanBehavior(runtime, dimensions);

	const panGesture = useMemo(() => {
		return Gesture.Pan()
			.enabled(true)
			.manualActivation(true)
			.maxPointers(1)
			.onTouchesDown(activation.onTouchesDown)
			.onTouchesMove(activation.onTouchesMove)
			.onStart(behavior.onStart)
			.onUpdate(behavior.onUpdate)
			.onEnd(behavior.onEnd);
	}, [activation, behavior]);

	return panGesture;
};
