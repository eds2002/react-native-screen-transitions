import { useMemo, useRef } from "react";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import { SystemStore } from "../../../stores/system.store";
import { claimsAnyDirection } from "../../../utils/gesture/compute-claimed-directions";
import { usePanActivation } from "../activation/use-pan-activation";
import { useDismissPanBehavior } from "../behaviors/use-dismiss-pan-behavior";
import { useSnapPanBehavior } from "../behaviors/use-snap-pan-behavior";
import { usePanPolicy } from "../config/use-pan-policy";
import { findShadowedAncestorPanGestures } from "../ownership/find-shadowed-ancestor-pan-gestures";
import type {
	DirectionClaimMap,
	GestureContextType,
	PanGestureRuntime,
	ScreenGestureConfig,
	ScrollConfig,
} from "../types";

interface BuildPanGestureHookProps {
	scrollConfig: SharedValue<ScrollConfig | null>;
	ancestorContext?: GestureContextType | null;
	config: ScreenGestureConfig;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}

export const useBuildPanGesture = ({
	scrollConfig,
	ancestorContext,
	config,
	childDirectionClaims,
}: BuildPanGestureHookProps): {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
} => {
	const policy = usePanPolicy({
		effectiveSnapPoints: config.effectiveSnapPoints,
	});

	const panGestureRef = useRef<GestureType | undefined>(undefined);

	const gestureStartProgress = useSharedValue(1);
	const lockedSnapPoint = useSharedValue(
		config.effectiveSnapPoints.maxSnapPoint,
	);

	const selfClaimsAny = claimsAnyDirection(config.claimedDirections);

	const runtime: PanGestureRuntime = {
		config,
		policy,
		stores: {
			gestureAnimationValues: GestureStore.getBag(config.routeKey),
			animations: AnimationStore.getBag(config.routeKey),
			targetProgressValue: SystemStore.getValue(
				config.routeKey,
				"targetProgress",
			),
			resolvedAutoSnapPointValue: SystemStore.getValue(
				config.routeKey,
				"resolvedAutoSnapPoint",
			),
		},
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

	return useMemo(() => {
		const panGesture = Gesture.Pan()
			.withRef(panGestureRef)
			.enabled(config.gestureEnabled)
			.manualActivation(true)
			.onTouchesDown(activation.onTouchesDown)
			.onTouchesMove(activation.onTouchesMove)
			.onStart(behavior.onStart)
			.onUpdate(behavior.onUpdate)
			.onEnd(behavior.onEnd);

		if (selfClaimsAny) {
			const shadowedAncestorGestures = findShadowedAncestorPanGestures(
				config.claimedDirections,
				ancestorContext,
			);
			for (const ancestorPan of shadowedAncestorGestures) {
				panGesture.blocksExternalGesture(ancestorPan);
			}
		}

		return {
			panGesture,
			panGestureRef,
		};
	}, [
		config.gestureEnabled,
		config.claimedDirections,
		selfClaimsAny,
		activation.onTouchesDown,
		activation.onTouchesMove,
		behavior.onStart,
		behavior.onUpdate,
		behavior.onEnd,
		ancestorContext,
	]);
};
