import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
import { usePinchBehavior } from "../behaviors/use-pinch-behavior";
import { usePinchPolicy } from "../config/use-pinch-policy";
import type {
	GestureRuntimeStores,
	PinchGesture,
	PinchGestureRuntime,
	ScreenGestureConfig,
} from "../types";

interface BuildPinchGestureHookProps {
	config: ScreenGestureConfig;
}

export const useBuildPinchGesture = ({
	config,
}: BuildPinchGestureHookProps): PinchGesture | undefined => {
	const policy = usePinchPolicy({
		canDismiss: config.canDismiss,
		hasSnapPoints: config.effectiveSnapPoints.hasSnapPoints,
	});

	const gestureStartProgress = useSharedValue(1);
	const lockedSnapPoint = useSharedValue(
		config.effectiveSnapPoints.maxSnapPoint,
	);
	const stores = useMemo<GestureRuntimeStores>(
		() => ({
			gestures: GestureStore.getBag(config.routeKey),
			animations: AnimationStore.getBag(config.routeKey),
			system: SystemStore.getBag(config.routeKey),
		}),
		[config.routeKey],
	);

	const runtime: PinchGestureRuntime = {
		config,
		policy,
		stores,
		gestureStartProgress,
		lockedSnapPoint,
	};

	const behavior = usePinchBehavior(runtime);

	const pinchGesture = useMemo(() => {
		if (!policy.enabled) return undefined;

		return Gesture.Pinch()
			.enabled(policy.enabled)
			.onStart(behavior.onStart)
			.onUpdate(behavior.onUpdate)
			.onEnd(behavior.onEnd);
	}, [policy.enabled, behavior.onStart, behavior.onUpdate, behavior.onEnd]);

	return pinchGesture;
};
