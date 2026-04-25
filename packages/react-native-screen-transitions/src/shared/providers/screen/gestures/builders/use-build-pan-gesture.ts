import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { usePanActivation } from "../activation/use-pan-activation";
import { usePanBehavior } from "../behaviors/use-pan-behavior";
import { usePanPolicy } from "../config/use-pan-policy";
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
	config: ScreenGestureConfig;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	runtimeOverrides: GestureRuntimeOverrides;
	ancestorPanGesturesToBlock: PanGesture[];
}

export const useBuildPanGesture = ({
	scrollState,
	config,
	childDirectionClaims,
	runtimeOverrides,
	ancestorPanGesturesToBlock,
}: BuildPanGestureHookProps): PanGesture => {
	const dimensions = useWindowDimensions();

	const gestureStartProgress = useSharedValue(1);
	const lockedSnapPoint = useSharedValue(
		config.effectiveSnapPoints.maxSnapPoint,
	);

	const policy = usePanPolicy(config);

	const runtime = useStableRuntimeConfig({
		config,
		policy,
		runtimeOverrides,
		gestureStartProgress,
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
		let gesture = Gesture.Pan()
			.enabled(true)
			.manualActivation(true)
			.maxPointers(1)
			.onTouchesDown(activation.onTouchesDown)
			.onTouchesMove(activation.onTouchesMove)
			.onStart(behavior.onStart)
			.onUpdate(behavior.onUpdate)
			.onEnd(behavior.onEnd);

		// If this screen claims the same direction as an ancestor,
		// block the ancestor so this one takes priority.
		if (ancestorPanGesturesToBlock.length) {
			gesture = gesture.blocksExternalGesture(...ancestorPanGesturesToBlock);
		}

		return gesture;
	}, [activation, behavior, ancestorPanGesturesToBlock]);

	return panGesture;
};
