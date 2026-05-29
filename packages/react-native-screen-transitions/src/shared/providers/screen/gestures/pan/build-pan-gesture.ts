import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useScreenOptionsStore } from "../../options";
import { useGestureBuilderState } from "../hooks/use-gesture-builder-state";
import { useStableRuntimeConfig } from "../hooks/use-stable-runtime-config";
import type {
	DirectionClaimMap,
	PanGesture,
	ScreenGestureConfig,
	ScrollGestureState,
} from "../types";
import { usePanActivation } from "./pan-activation";
import { usePanBehavior } from "./use-pan-behavior";

interface BuildPanGestureHookProps {
	scrollState: SharedValue<ScrollGestureState | null>;
	gestureConfig: ScreenGestureConfig;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}

export const useBuildPanGesture = ({
	scrollState,
	gestureConfig,
	childDirectionClaims,
}: BuildPanGestureHookProps): PanGesture => {
	const dimensions = useWindowDimensions();
	const { participation, pan: policy } = gestureConfig;
	const screenOptions = useScreenOptionsStore((store) => store);

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
	});

	const behavior = usePanBehavior(runtime, screenOptions, dimensions);

	const panGestureConfig = useMemo(
		() => ({
			enabled: true,
			manualActivation: true,
			maxPointers: 1,
			onTouchesDown: activation.onTouchesDown,
			onTouchesMove: activation.onTouchesMove,
			onActivate: behavior.onStart,
			onUpdate: behavior.onUpdate,
			onDeactivate: behavior.onEnd,
		}),
		[activation, behavior],
	);

	const panGesture = usePanGesture(panGestureConfig);

	return panGesture;
};
