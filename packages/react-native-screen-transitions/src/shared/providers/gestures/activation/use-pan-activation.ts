import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import type { GestureTouchEvent } from "react-native-gesture-handler";
import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { EPSILON } from "../../../constants";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import { GestureStore } from "../../../stores/gesture.store";
import { GestureOffsetState } from "../../../types/gesture.types";
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
	const { config, policy, stores, lockedSnapPoint } = runtime;
	const { parentScreenKey } = useDescriptorDerivations();
	const {
		hasSnapPoints,
		hasAutoSnapPoint,
		snapPoints,
		minSnapPoint,
		maxSnapPoint,
	} = config.effectiveSnapPoints;

	const dimensions = useWindowDimensions();
	const ancestorDismissing = useMemo(() => {
		if (!parentScreenKey) return null;
		return GestureStore.peekBag(parentScreenKey)?.dismissing ?? null;
	}, [parentScreenKey]);

	const initialTouch = useSharedValue({ x: 0, y: 0 });
	const gestureOffsetState = useSharedValue<GestureOffsetState>(
		GestureOffsetState.PENDING,
	);

	const onTouchesDown = useStableCallbackValue<
		(event: GestureTouchEvent) => void
	>((event) => {
		"worklet";
		const firstTouch = event.changedTouches[0];
		initialTouch.value = { x: firstTouch.x, y: firstTouch.y };
		gestureOffsetState.value = GestureOffsetState.PENDING;
	});

	const onTouchesMove = useStableCallbackValue(
		(event: GestureTouchEvent, manager: GestureStateManagerType) => {
			"worklet";

			if (ancestorDismissing?.value) {
				gestureOffsetState.value = GestureOffsetState.FAILED;
				manager.fail();
				return;
			}

			const touch = event.changedTouches[0];

			const { isSwipingDown, isSwipingUp, isSwipingRight, isSwipingLeft } =
				applyOffsetRules({
					touch,
					directions: policy.directions,
					manager,
					dimensions,
					gestureOffsetState,
					initialTouch: initialTouch.value,
					activationArea: policy.gestureActivationArea,
					responseDistance: policy.gestureResponseDistance,
				});

			if (gestureOffsetState.value === GestureOffsetState.FAILED) {
				manager.fail();
				return;
			}

			if (stores.gestureAnimationValues.dragging.value) {
				manager.activate();
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
				manager.fail();
				return;
			}

			const childClaim = childDirectionClaims.value[swipeDirection];
			if (shouldDeferToChildClaim(childClaim, config.routeKey)) {
				manager.fail();
				return;
			}

			if (gestureOffsetState.value !== GestureOffsetState.PASSED) {
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
				manager.fail();
				return;
			}

			if (!hasSnapPoints && stores.gestureAnimationValues.dismissing.value) {
				return;
			}

			const scrollCfg = scrollConfig.value;
			const isTouchingScrollView = scrollCfg?.isTouched ?? false;

			if (isTouchingScrollView) {
				const atBoundary = checkScrollBoundary(
					scrollCfg,
					swipeDirection,
					hasSnapPoints ? policy.directions.snapAxisInverted : undefined,
				);

				if (!atBoundary) {
					manager.fail();
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
						manager.fail();
						return;
					}

					const { resolvedMaxSnapPoint } = resolveRuntimeSnapPoints({
						snapPoints,
						hasAutoSnapPoint,
						resolvedAutoSnapPoint: stores.resolvedAutoSnapPointValue.value,
						minSnapPoint,
						maxSnapPoint,
						canDismiss: config.canDismiss,
					});

					const effectiveMaxSnapPoint = policy.gestureSnapLocked
						? lockedSnapPoint.value
						: resolvedMaxSnapPoint;

					const canExpandMore =
						stores.animations.progress.value <
							effectiveMaxSnapPoint - EPSILON &&
						stores.targetProgressValue.value < effectiveMaxSnapPoint - EPSILON;

					if (!canExpandMore) {
						manager.fail();
						return;
					}
				}
			}

			stores.gestureAnimationValues.direction.value = swipeDirection;
			manager.activate();
		},
	);

	return { onTouchesDown, onTouchesMove };
};
