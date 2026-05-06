import { useCallback, useMemo } from "react";
import type {
	GestureStateManager,
	GestureTouchEvent,
} from "react-native-gesture-handler";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { EPSILON } from "../../../../constants";
import { GestureStore } from "../../../../stores/gesture.store";
import { GestureActivationState } from "../../../../types/gesture.types";
import type { Direction } from "../../../../types/ownership.types";
import { useDescriptorDerivations } from "../../descriptors";
import type { ScreenOptionsContextValue } from "../../options";
import {
	applyOffsetRules,
	checkScrollBoundary,
} from "../helpers/gesture-activation";
import { getPanSnapAxisConfigForDirection } from "../helpers/gesture-directions";
import { resolveRuntimeSnapPoints } from "../helpers/gesture-snap-points";
import { resolvePanRuntime } from "../helpers/runtime-options";
import { shouldDeferToChildClaim } from "../ownership/should-defer-to-child-claim";
import type {
	DirectionClaimMap,
	GestureDimensions,
	PanGestureRuntime,
	ScrollGestureState,
} from "../types";

interface UsePanActivationProps {
	scrollState: SharedValue<ScrollGestureState | null>;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	runtime: SharedValue<PanGestureRuntime>;
	screenOptions: ScreenOptionsContextValue;
	dimensions: GestureDimensions;
}

export const usePanActivation = ({
	scrollState,
	childDirectionClaims,
	runtime,
	screenOptions,
	dimensions,
}: UsePanActivationProps) => {
	const { currentScreenKey, parentScreenKey } = useDescriptorDerivations();

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
			stateManager: GestureStateManager | undefined,
		) => {
			"worklet";
			const { participation, policy } = resolvePanRuntime(
				runtime.get(),
				screenOptions,
			);

			if (
				!participation.canTrackGesture ||
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
		[gestureActivationState, initialTouch, runtime, screenOptions],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent, stateManager: GestureStateManager) => {
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
				participation,
				policy,
				stores: { animations, gestures, system },
			} = resolvePanRuntime(runtime.get(), screenOptions);
			const {
				hasSnapPoints,
				hasAutoSnapPoint,
				snapPoints,
				minSnapPoint,
				maxSnapPoint,
			} = participation.effectiveSnapPoints;

			if (!participation.canTrackGesture || !policy.enabled) {
				gestureActivationState.set(GestureActivationState.FAILED);
				stateManager.fail();
				return;
			}

			const touch = event.changedTouches[0];

			const { isSwipingDown, isSwipingUp, isSwipingRight, isSwipingLeft } =
				applyOffsetRules({
					touch,
					directions: policy.panActivationDirections,
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

			if (participation.ownershipStatus[swipeDirection] !== "self") {
				stateManager.fail();
				return;
			}

			// A nested screen shadowing this direction gets priority while it is active.
			const childClaim = childDirectionClaims.get()[swipeDirection];
			if (shouldDeferToChildClaim(childClaim, currentScreenKey)) {
				stateManager.fail();
				return;
			}

			if (gestureActivationState.get() !== GestureActivationState.PASSED) {
				return;
			}

			const activeSnapAxis = hasSnapPoints
				? getPanSnapAxisConfigForDirection(
						policy.snapAxisDirections,
						swipeDirection,
					)
				: null;
			const isExpandGesture = activeSnapAxis?.config.expand === swipeDirection;

			if (hasSnapPoints && policy.gestureSnapLocked && isExpandGesture) {
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
					activeSnapAxis?.config.inverted,
				);

				if (!atBoundary) {
					stateManager.fail();
					return;
				}

				if (hasSnapPoints && isExpandGesture) {
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
						canDismiss: participation.canDismiss,
					});

					const canExpandMore =
						animations.progress.get() < resolvedMaxSnapPoint - EPSILON &&
						system.targetProgress.get() < resolvedMaxSnapPoint - EPSILON;

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
			currentScreenKey,
			dimensions,
			gestureActivationState,
			initialTouch,
			runtime,
			screenOptions,
			scrollState,
		],
	);

	return { onTouchesDown, onTouchesMove };
};
