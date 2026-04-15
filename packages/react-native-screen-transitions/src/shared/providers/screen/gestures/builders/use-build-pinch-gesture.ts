import {
	type PinchGesture,
	usePinchGesture,
} from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { useDismissPinchBehavior } from "../behaviors/use-dismiss-pinch-behavior";
import { useSnapPinchBehavior } from "../behaviors/use-snap-pinch-behavior";
import { usePinchPolicy } from "../config/use-pinch-policy";
import type { PinchGestureRuntime, ScreenGestureConfig } from "../types";

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

	const runtime: PinchGestureRuntime = {
		config,
		policy,
		gestureStartProgress,
		lockedSnapPoint,
	};

	const dismissBehavior = useDismissPinchBehavior(runtime);
	const snapBehavior = useSnapPinchBehavior(runtime);

	const behavior = runtime.config.effectiveSnapPoints.hasSnapPoints
		? snapBehavior
		: dismissBehavior;

	const pinchGesture = usePinchGesture({
		enabled: policy.enabled,
		onActivate: behavior.onStart,
		onUpdate: behavior.onUpdate,
		onDeactivate: behavior.onEnd,
	});

	return policy.enabled ? pinchGesture : undefined;
};
