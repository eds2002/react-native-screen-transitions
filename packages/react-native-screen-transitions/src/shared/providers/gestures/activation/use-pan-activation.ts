import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	GestureStateManager,
	type GestureTouchEvent,
} from "react-native-gesture-handler";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { EPSILON } from "../../../constants";
import { AnimationStore } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import { SystemStore } from "../../../stores/system.store";
import { GestureActivationState } from "../../../types/gesture.types";
import type { Direction } from "../../../types/ownership.types";
import { useDescriptorDerivations } from "../../screen/descriptors";
import {
	applyOffsetRules,
	checkScrollBoundary,
} from "../helpers/gesture-activation";
import { isExpandGestureForDirection } from "../helpers/gesture-directions";
import { resolveRuntimeSnapPoints } from "../helpers/gesture-snap-points";
import { shouldDeferToChildClaim } from "../ownership/should-defer-to-child-claim";
import type {
	DirectionClaimMap,
	PanGestureRuntime,
	ScrollConfig,
} from "../types";

interface UsePanActivationProps {
	scrollConfig: SharedValue<ScrollConfig | null>;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	runtime: PanGestureRuntime;
}

export const usePanActivation = ({
	scrollConfig,
	childDirectionClaims,
	runtime,
}: UsePanActivationProps) => {
	const { config, policy, lockedSnapPoint } = runtime;
	const { parentScreenKey } = useDescriptorDerivations();
	const {
		hasSnapPoints,
		hasAutoSnapPoint,
		snapPoints,
		minSnapPoint,
		maxSnapPoint,
	} = config.effectiveSnapPoints;

	const animations = AnimationStore.getBag(runtime.config.routeKey);
	const gestures = GestureStore.getBag(runtime.config.routeKey);
	const system = SystemStore.getBag(runtime.config.routeKey);

	const dimensions = useWindowDimensions();

	const ancestorDismissing = useMemo(() => {
		if (!parentScreenKey) return null;
		return GestureStore.peekBag(parentScreenKey)?.dismissing ?? null;
	}, [parentScreenKey]);

	const initialTouch = useSharedValue({ x: 0, y: 0 });

	const gestureActivationState = useSharedValue<GestureActivationState>(
		GestureActivationState.PENDING,
	);

	const onTouchesDown = useCallback(
		(event: GestureTouchEvent) => {
			"worklet";
			if (event.numberOfTouches !== 1) {
				gestureActivationState.set(GestureActivationState.FAILED);
				return;
			}

			const firstTouch = event.changedTouches[0];
			initialTouch.set({ x: firstTouch.x, y: firstTouch.y });
			gestureActivationState.set(GestureActivationState.PENDING);
		},
		[gestureActivationState, initialTouch],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent) => {
			"worklet";
			const handlerTag = event.handlerTag;

			if (event.numberOfTouches !== 1) {
				gestureActivationState.set(GestureActivationState.FAILED);
				GestureStateManager.fail(handlerTag);
				return;
			}

			if (ancestorDismissing?.get()) {
				gestureActivationState.set(GestureActivationState.FAILED);
				GestureStateManager.fail(handlerTag);
				return;
			}

			const touch = event.changedTouches[0];

			const { isSwipingDown, isSwipingUp, isSwipingRight, isSwipingLeft } =
				applyOffsetRules({
					touch,
					directions: policy.directions,
					dimensions,
					gestureActivationState,
					initialTouch: initialTouch.get(),
					activationArea: policy.gestureActivationArea,
					responseDistance: policy.gestureResponseDistance,
				});

			if (gestureActivationState.get() === GestureActivationState.FAILED) {
				GestureStateManager.fail(handlerTag);
				return;
			}

			if (gestures.dragging.get()) {
				GestureStateManager.activate(handlerTag);
				return;
			}

			let swipeDirection: Direction | null = null;
			if (isSwipingDown) swipeDirection = "vertical";
			else if (isSwipingUp) swipeDirection = "vertical-inverted";
			else if (isSwipingRight) swipeDirection = "horizontal";
			else if (isSwipingLeft) swipeDirection = "horizontal-inverted";

			if (!swipeDirection) {
				return;
			}

			if (config.ownershipStatus[swipeDirection] !== "self") {
				GestureStateManager.fail(handlerTag);
				return;
			}

			const childClaim = childDirectionClaims.get()[swipeDirection];
			if (shouldDeferToChildClaim(childClaim, config.routeKey)) {
				GestureStateManager.fail(handlerTag);
				return;
			}

			if (gestureActivationState.get() !== GestureActivationState.PASSED) {
				return;
			}

			if (
				hasSnapPoints &&
				policy.gestureSnapLocked &&
				isExpandGestureForDirection(
					swipeDirection,
					policy.snapAxis,
					policy.directions.snapAxisInverted ?? false,
				)
			) {
				GestureStateManager.fail(handlerTag);
				return;
			}

			if (!hasSnapPoints && gestures.dismissing.get()) {
				return;
			}

			const scrollCfg = scrollConfig.get();
			const isTouchingScrollView = scrollCfg?.isTouched ?? false;

			if (isTouchingScrollView) {
				const atBoundary = checkScrollBoundary(
					scrollCfg,
					swipeDirection,
					hasSnapPoints ? policy.directions.snapAxisInverted : undefined,
				);

				if (!atBoundary) {
					GestureStateManager.fail(handlerTag);
					return;
				}

				if (
					hasSnapPoints &&
					isExpandGestureForDirection(
						swipeDirection,
						policy.snapAxis,
						policy.directions.snapAxisInverted ?? false,
					)
				) {
					if (policy.sheetScrollGestureBehavior === "collapse-only") {
						GestureStateManager.fail(handlerTag);
						return;
					}

					const { resolvedMaxSnapPoint } = resolveRuntimeSnapPoints({
						snapPoints,
						hasAutoSnapPoint,
						resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
						minSnapPoint,
						maxSnapPoint,
						canDismiss: config.canDismiss,
					});

					const effectiveMaxSnapPoint = policy.gestureSnapLocked
						? lockedSnapPoint.get()
						: resolvedMaxSnapPoint;

					const canExpandMore =
						animations.progress.get() < effectiveMaxSnapPoint - EPSILON &&
						system.targetProgress.get() < effectiveMaxSnapPoint - EPSILON;

					if (!canExpandMore) {
						GestureStateManager.fail(handlerTag);
						return;
					}
				}
			}

			gestures.direction.set(swipeDirection);
			GestureStateManager.activate(handlerTag);
		},
		[
			ancestorDismissing,
			animations.progress,
			childDirectionClaims,
			config.canDismiss,
			config.ownershipStatus,
			config.routeKey,
			dimensions,
			gestureActivationState,
			gestures.direction,
			gestures.dismissing,
			gestures.dragging,
			hasAutoSnapPoint,
			hasSnapPoints,
			initialTouch,
			lockedSnapPoint,
			maxSnapPoint,
			minSnapPoint,
			policy.directions,
			policy.gestureActivationArea,
			policy.gestureResponseDistance,
			policy.gestureSnapLocked,
			policy.sheetScrollGestureBehavior,
			policy.snapAxis,
			policy.directions.snapAxisInverted,
			scrollConfig,
			snapPoints,
			system.resolvedAutoSnapPoint,
			system.targetProgress,
		],
	);

	return { onTouchesDown, onTouchesMove };
};
