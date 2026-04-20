import { useMemo } from "react";
import { type PanGesture, usePanGesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";
import { usePanActivation } from "../activation/use-pan-activation";
import { usePanBehavior } from "../behaviors/use-pan-behavior";
import { usePanPolicy } from "../config/use-pan-policy";
import { useGestureContext } from "../gestures.provider";
import { claimsAnyDirection } from "../ownership/compute-claimed-directions";
import { findShadowedAncestorPanGestures } from "../ownership/find-shadowed-ancestor-pan-gestures";
import type {
	DirectionClaimMap,
	GestureRuntimeStores,
	PanGestureRuntime,
	ScreenGestureConfig,
	ScrollGestureState,
} from "../types";

interface BuildPanGestureHookProps {
	scrollState: SharedValue<ScrollGestureState | null>;
	config: ScreenGestureConfig;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}

export const useBuildPanGesture = ({
	scrollState,
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
	const stores = useMemo<GestureRuntimeStores>(
		() => ({
			gestures: GestureStore.getBag(config.routeKey),
			animations: AnimationStore.getBag(config.routeKey),
			system: SystemStore.getBag(config.routeKey),
		}),
		[config.routeKey],
	);

	const selfClaimsAny = claimsAnyDirection(config.claimedDirections);

	const runtime: PanGestureRuntime = {
		config,
		policy,
		stores,
		gestureStartProgress,
		lockedSnapPoint,
	};

	const activation = usePanActivation({
		scrollState,
		childDirectionClaims,
		runtime,
	});

	const behavior = usePanBehavior(runtime);

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
