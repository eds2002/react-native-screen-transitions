import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	Gesture,
	type GestureStateChangeEvent,
	type GestureTouchEvent,
	type GestureUpdateEvent,
	type PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import {
	interpolate,
	runOnJS,
	type SharedValue,
	useSharedValue,
} from "react-native-reanimated";
import type { ScrollProgress } from "../../providers/gestures";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import { Gestures } from "../../stores/gestures";
import { NavigatorDismissState } from "../../stores/navigator-dismiss-state";
import { animate } from "../../utils/animation/animate";
import { runTransition } from "../../utils/animation/run-transition";
import { applyGestureActivationCriteria } from "../../utils/gesture/apply-gesture-activation-criteria";
import { mapGestureToProgress } from "../../utils/gesture/map-gesture-to-progress";

const GESTURE_VELOCITY_IMPACT = 0.3;
const GESTURE_ACTIVATION_THRESHOLD = 5;
const DEFAULT_GESTURE_DIRECTION = "horizontal";
const DEFAULT_GESTURE_ENABLED = false;
const DEFAULT_GESTURE_DRIVES_PROGRESS = true;
const DEFAULT_INITIAL_TOUCH = {
	x: 0,
	y: 0,
};

interface BuildGesturesHookProps {
	scrollProgress: SharedValue<ScrollProgress | null>;
}

export const useBuildGestures = ({
	scrollProgress,
}: BuildGesturesHookProps) => {
	const dimensions = useWindowDimensions();
	const { current } = useKeys();

	const initialTouch = useSharedValue(DEFAULT_INITIAL_TOUCH);

	const gestures = Gestures.getRouteGestures(current.route.key);

	const animations = Animations.getAll(current.route.key);

	const {
		gestureDirection = DEFAULT_GESTURE_DIRECTION,
		gestureEnabled = DEFAULT_GESTURE_ENABLED,
		gestureVelocityImpact = GESTURE_VELOCITY_IMPACT,
		gestureDrivesProgress = DEFAULT_GESTURE_DRIVES_PROGRESS,
		gestureResponseDistance,
		transitionSpec,
	} = current.options;

	const directions = useMemo(() => {
		const directionsArray = Array.isArray(gestureDirection)
			? gestureDirection
			: [gestureDirection];
		const isBidirectional = directionsArray.includes("bidirectional");

		return {
			vertical: directionsArray.includes("vertical") || isBidirectional,
			verticalInverted:
				directionsArray.includes("vertical-inverted") || isBidirectional,
			horizontal: directionsArray.includes("horizontal") || isBidirectional,
			horizontalInverted:
				directionsArray.includes("horizontal-inverted") || isBidirectional,
		};
	}, [gestureDirection]);

	const onTouchesDown = useCallback(
		(e: GestureTouchEvent) => {
			"worklet";
			const firstTouch = e.changedTouches[0];
			initialTouch.value = { x: firstTouch.x, y: firstTouch.y };
		},
		[initialTouch],
	);

	const onTouchesMove = useCallback(
		(e: GestureTouchEvent, manager: GestureStateManagerType) => {
			"worklet";

			const touch = e.changedTouches[0];
			const deltaX = touch.x - initialTouch.value.x;
			const deltaY = touch.y - initialTouch.value.y;

			const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
			const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

			const isSwipingDown = isVerticalSwipe && deltaY > 0;
			const isSwipingUp = isVerticalSwipe && deltaY < 0;
			const isSwipingRight = isHorizontalSwipe && deltaX > 0;
			const isSwipingLeft = isHorizontalSwipe && deltaX < 0;

			const hasEnoughMovement =
				Math.abs(deltaX) > GESTURE_ACTIVATION_THRESHOLD ||
				Math.abs(deltaY) > GESTURE_ACTIVATION_THRESHOLD;

			if (!hasEnoughMovement) return;

			if (gestures.isDragging?.value) {
				manager.activate();
				return;
			}

			let shouldActivate = false;

			if (directions.vertical && isSwipingDown) {
				if (scrollProgress.value?.y) {
					shouldActivate = scrollProgress.value.y <= 0;
				} else {
					shouldActivate = true;
				}
				gestures.triggerDirection.value = "vertical";
			}
			if (directions.horizontal && isSwipingRight) {
				if (scrollProgress.value) {
					shouldActivate = scrollProgress.value.x <= 0;
				} else {
					shouldActivate = true;
				}
				gestures.triggerDirection.value = "horizontal";
			}

			if (directions.verticalInverted && isSwipingUp) {
				if (scrollProgress.value) {
					const maxScrollableY =
						scrollProgress.value.contentHeight -
						scrollProgress.value.layoutHeight;

					shouldActivate = scrollProgress.value.y >= maxScrollableY;
				} else {
					shouldActivate = true;
				}
				gestures.triggerDirection.value = "vertical-inverted";
			}

			if (directions.horizontalInverted && isSwipingLeft) {
				if (scrollProgress.value) {
					const maxScrollableX =
						scrollProgress.value.contentWidth -
						scrollProgress.value.layoutWidth;
					shouldActivate = scrollProgress.value.x >= maxScrollableX;
				} else {
					shouldActivate = true;
				}
				gestures.triggerDirection.value = "horizontal-inverted";
			}

			if (
				(shouldActivate || gestures.isDragging?.value) &&
				!gestures.isDismissing?.value
			) {
				manager.activate();
			} else {
				manager.fail();
			}
		},
		[initialTouch, scrollProgress, gestures, directions],
	);

	const onStart = useCallback(() => {
		"worklet";
		gestures.isDragging.value = 1;
		gestures.isDismissing.value = 0;
	}, [gestures]);

	const onUpdate = useCallback(
		(event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			let gestureProgress = 0;

			gestures.x.value = event.translationX;
			gestures.y.value = event.translationY;

			gestures.normalizedX.value = interpolate(
				event.translationX,
				[-dimensions.width, dimensions.width],
				[-1, 1],
				"clamp",
			);
			gestures.normalizedY.value = interpolate(
				event.translationY,
				[-dimensions.height, dimensions.height],
				[-1, 1],
				"clamp",
			);

			let maxProgress = 0;

			const allowedDown = directions.vertical;
			const allowedUp = directions.verticalInverted;
			const allowedRight = directions.horizontal;
			const allowedLeft = directions.horizontalInverted;

			if (allowedRight && event.translationX > 0) {
				const currentProgress = mapGestureToProgress(
					event.translationX,
					dimensions.width,
				);
				maxProgress = Math.max(maxProgress, currentProgress);
			}

			if (allowedLeft && event.translationX < 0) {
				const currentProgress = mapGestureToProgress(
					-event.translationX,
					dimensions.width,
				);
				maxProgress = Math.max(maxProgress, currentProgress);
			}

			if (allowedDown && event.translationY > 0) {
				const currentProgress = mapGestureToProgress(
					event.translationY,
					dimensions.height,
				);
				maxProgress = Math.max(maxProgress, currentProgress);
			}

			if (allowedUp && event.translationY < 0) {
				const currentProgress = mapGestureToProgress(
					-event.translationY,
					dimensions.height,
				);
				maxProgress = Math.max(maxProgress, currentProgress);
			}

			gestureProgress = maxProgress;

			if (gestureDrivesProgress) {
				animations.progress.value = 1 - gestureProgress;
			}
		},
		[dimensions, gestures, animations, gestureDrivesProgress, directions],
	);

	const setNavigatorDismissal = useCallback(() => {
		const key = current.navigation.getState().key;

		NavigatorDismissState.set(key, true);
	}, [current]);

	const handleDismiss = useCallback(() => {
		const key = current.navigation.getState().key;
		current.navigation.goBack();
		NavigatorDismissState.remove(key);
	}, [current]);

	const onEnd = useCallback(
		(event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			const { translationX, translationY, velocityX, velocityY } = event;

			// reminder: we should make this into an option
			const dismissThreshold = 0.5;

			const finalX = translationX + velocityX * gestureVelocityImpact;
			const finalY = translationY + velocityY * gestureVelocityImpact;

			const diagonal = Math.sqrt(
				dimensions.width * dimensions.width +
					dimensions.height * dimensions.height,
			);

			let shouldDismiss = false;

			const horizontalDistance = Math.abs(finalX);
			const verticalDistance = Math.abs(finalY);
			const crossAxisThreshold = diagonal * dismissThreshold * 0.7;

			if (directions.vertical && finalY > 0) {
				shouldDismiss = verticalDistance > diagonal * dismissThreshold;
			} else if (directions.verticalInverted && finalY < 0) {
				shouldDismiss = verticalDistance > diagonal * dismissThreshold;
			} else if (directions.horizontal && finalX > 0) {
				shouldDismiss = horizontalDistance > diagonal * dismissThreshold;
			} else if (directions.horizontalInverted && finalX < 0) {
				shouldDismiss = horizontalDistance > diagonal * dismissThreshold;
			}

			if (!shouldDismiss) {
				if (
					(directions.vertical || directions.verticalInverted) &&
					horizontalDistance > crossAxisThreshold
				) {
					shouldDismiss = true;
				} else if (
					(directions.horizontal || directions.horizontalInverted) &&
					verticalDistance > crossAxisThreshold
				) {
					shouldDismiss = true;
				}
			}

			gestures.isDismissing.value = Number(shouldDismiss);

			if (gestures.isDismissing.value) {
				runOnJS(setNavigatorDismissal)();
			}

			runTransition({
				target: gestures.isDismissing.value ? "close" : "open",
				spec: transitionSpec,
				onFinish: gestures.isDismissing.value ? handleDismiss : undefined,
				animations,
			});

			const spec = gestures.isDismissing.value
				? transitionSpec?.close
				: transitionSpec?.open;

			gestures.x.value = animate(0, spec);
			gestures.y.value = animate(0, spec);
			gestures.normalizedX.value = animate(0, spec);
			gestures.normalizedY.value = animate(0, spec);
			gestures.isDragging.value = 0;
			gestures.triggerDirection.value = null;
		},
		[
			dimensions,
			animations,
			transitionSpec,
			gestureVelocityImpact,
			setNavigatorDismissal,
			handleDismiss,
			gestures,
			directions,
		],
	);

	return useMemo(() => {
		const nativeGesture = Gesture.Native();

		const panGesture = Gesture.Pan()
			.enabled(gestureEnabled)
			.manualActivation(true)
			.onTouchesDown(onTouchesDown)
			.onTouchesMove(onTouchesMove)
			.onStart(onStart)
			.onUpdate(onUpdate)
			.onEnd(onEnd)
			.blocksExternalGesture(nativeGesture);

		applyGestureActivationCriteria({
			gestureResponseDistance,
			panGesture,
			directions,
		});

		return { panGesture, nativeGesture };
	}, [
		gestureEnabled,
		gestureResponseDistance,
		onTouchesDown,
		onTouchesMove,
		onStart,
		onUpdate,
		onEnd,
		directions,
	]);
};
