import { useMemo } from "react";
import { type PanGesture, usePanGesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { claimsAnyDirection } from "../../../utils/gesture/compute-claimed-directions";
import { usePanActivation } from "../activation/use-pan-activation";
import { useDismissPanBehavior } from "../behaviors/use-dismiss-pan-behavior";
import { useSnapPanBehavior } from "../behaviors/use-snap-pan-behavior";
import { usePanPolicy } from "../config/use-pan-policy";
import { useGestureContext } from "../gestures.provider";
import { findShadowedAncestorPanGestures } from "../ownership/find-shadowed-ancestor-pan-gestures";
import type {
	DirectionClaimMap,
	PanGestureRuntime,
	ScreenGestureConfig,
	ScrollConfig,
} from "../types";

interface BuildPanGestureHookProps {
	scrollConfig: SharedValue<ScrollConfig | null>;
	config: ScreenGestureConfig;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}

export const useBuildPanGesture = ({
	scrollConfig,
	config,
	childDirectionClaims,
}: BuildPanGestureHookProps): PanGesture => {
	const gestureContext = useGestureContext();
	const policy = usePanPolicy({
		effectiveSnapPoints: config.effectiveSnapPoints,
	});

	const gestureStartProgress = useSharedValue(1);
	const lockedSnapPoint = useSharedValue(
		config.effectiveSnapPoints.maxSnapPoint,
	);

	const selfClaimsAny = claimsAnyDirection(config.claimedDirections);

	const runtime: PanGestureRuntime = {
		config,
		policy,
		gestureStartProgress,
		lockedSnapPoint,
	};

	const activation = usePanActivation({
		scrollConfig,
		childDirectionClaims,
		runtime,
	});

	const dismissBehavior = useDismissPanBehavior(runtime);
	const snapBehavior = useSnapPanBehavior(runtime);

	const behavior = config.effectiveSnapPoints.hasSnapPoints
		? snapBehavior
		: dismissBehavior;

	const shadowedAncestorGestures = useMemo(
		() =>
			selfClaimsAny
				? findShadowedAncestorPanGestures(
						config.claimedDirections,
						gestureContext,
					)
				: undefined,
		[config.claimedDirections, selfClaimsAny, gestureContext],
	);

	const panGesture = usePanGesture({
		enabled: config.gestureEnabled && policy.enabled,
		manualActivation: true,
		maxPointers: 1,
		onTouchesDown: activation.onTouchesDown,
		onTouchesMove: activation.onTouchesMove,
		onActivate: behavior.onStart,
		onUpdate: behavior.onUpdate,
		onDeactivate: behavior.onEnd,
		block: shadowedAncestorGestures,
	});

	return panGesture;
};
