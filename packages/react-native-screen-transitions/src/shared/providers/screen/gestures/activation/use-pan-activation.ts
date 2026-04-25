import { useCallback, useMemo } from "react";
import type { GestureTouchEvent } from "react-native-gesture-handler";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { EPSILON } from "../../../../constants";
import { GestureStore } from "../../../../stores/gesture.store";
import { GestureActivationState } from "../../../../types/gesture.types";
import type { Direction } from "../../../../types/ownership.types";
import { useDescriptorDerivations } from "../../descriptors";
import {
	applyOffsetRules,
	checkScrollBoundary,
} from "../helpers/gesture-activation";
import { isExpandGestureForDirection } from "../helpers/gesture-directions";
import { resolveRuntimeSnapPoints } from "../helpers/gesture-snap-points";
import { shouldDeferToChildClaim } from "../ownership/should-defer-to-child-claim";
import type {
	DirectionClaimMap,
	GestureDimensions,
	PanGestureRuntime,
	ScrollGestureState,
} from "../types";

type LegacyGestureStateManager = {
	activate: () => void;
	fail: () => void;
};

interface UsePanActivationProps {
	scrollState: SharedValue<ScrollGestureState | null>;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	runtime: SharedValue<PanGestureRuntime>;
	dimensions: GestureDimensions;
}

export const usePanActivation = ({
	scrollState,
	childDirectionClaims,
	runtime,
	dimensions,
}: UsePanActivationProps) => {
	const { parentScreenKey } = useDescriptorDerivations();

	const ancestorDismissing = useMemo(() => {
		if (!parentScreenKey) return null;
		return GestureStore.peekBag(parentScreenKey)?.dismissing ?? null;
	}, [parentScreenKey]);

	const initialTouch = useSharedValue({ x: 0, y: 0 });

	const gestureActivationState = useSharedValue<GestureActivationState>(
		GestureActivationState.PENDING,
	);

	const onTouchesDown = useCallback(
		(
			event: GestureTouchEvent,
			stateManager: LegacyGestureStateManager | undefined,
		) => {
			"worklet";
			const { config, policy } = runtime.get();

			if (
				!config.gestureEnabled ||
				!policy.enabled ||
				event.numberOfTouches !== 1
			) {
				gestureActivationState.set(GestureActivationState.FAILED);
				stateManager?.fail();
				return;
			}

			const firstTouch = event.changedTouches[0];
			initialTouch.set({ x: firstTouch.x, y: firstTouch.y });
			gestureActivationState.set(GestureActivationState.PENDING);
		},
		[gestureActivationState, initialTouch, runtime],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent, stateManager: LegacyGestureStateManager) => {
			"worklet";

			if (event.numberOfTouches !== 1) {
				gestureActivationState.set(GestureActivationState.FAILED);
				stateManager.fail();
				return;
			}

			if (ancestorDismissing?.get()) {
				gestureActivationState.set(GestureActivationState.FAILED);
				stateManager.fail();
				return;
			}

			const {
				config,
				policy,
				lockedSnapPoint,
				stores: { animations, gestures, system },
			} = runtime.get();
			const {
				hasSnapPoints,
				hasAutoSnapPoint,
				snapPoints,
				minSnapPoint,
				maxSnapPoint,
			} = config.effectiveSnapPoints;

			if (!config.gestureEnabled || !policy.enabled) {
				gestureActivationState.set(GestureActivationState.FAILED);
				stateManager.fail();
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
				stateManager.fail();
				return;
			}

			if (gestures.dragging.get()) {
				stateManager.activate();
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
				stateManager.fail();
				return;
			}

			// A nested screen shadowing this direction gets priority while it is active.
			const childClaim = childDirectionClaims.get()[swipeDirection];
			if (shouldDeferToChildClaim(childClaim, config.routeKey)) {
				stateManager.fail();
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
				stateManager.fail();
				return;
			}

			if (!hasSnapPoints && gestures.dismissing.get()) {
				return;
			}

			const currentScrollState = scrollState.get();
			const isTouchingScrollView = currentScrollState?.isTouched ?? false;

			if (isTouchingScrollView) {
				const atBoundary = checkScrollBoundary(
					currentScrollState,
					swipeDirection,
					hasSnapPoints ? policy.directions.snapAxisInverted : undefined,
				);

				if (!atBoundary) {
					stateManager.fail();
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
						stateManager.fail();
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
						stateManager.fail();
						return;
					}
				}
			}

			gestures.direction.set(swipeDirection);
			stateManager.activate();
		},
		[
			ancestorDismissing,
			childDirectionClaims,
			dimensions,
			gestureActivationState,
			initialTouch,
			runtime,
			scrollState,
		],
	);

	return { onTouchesDown, onTouchesMove };
};
