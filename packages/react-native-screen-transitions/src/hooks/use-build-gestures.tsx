import { useNavigation } from "@react-navigation/native";
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
import { DefaultSpec } from "@/configs/specs";
import type { ScrollProgress } from "@/contexts/gesture";
import { animationValues } from "../animation-engine";
import { ScreenStore } from "../store";
import { animate } from "../utils";
import { applyGestureActivationCriteria } from "../utils/gesture/apply-gesture-activation-criteria";
import { mapGestureToProgress } from "../utils/gesture/map-gesture-to-progress";
import { useKey } from "./use-key";

const GESTURE_VELOCITY_IMPACT = 0.3;
const DEFAULT_GESTURE_RESPONSE_DISTANCE = 50;
const DEFAULT_GESTURE_DIRECTION = "horizontal";
const DEFAULT_GESTURE_ENABLED = false;

interface BuildGesturesHookProps {
	scrollProgress: SharedValue<ScrollProgress>;
}

export const useBuildGestures = ({
	scrollProgress,
}: BuildGesturesHookProps) => {
	const key = useKey();
	const dimensions = useWindowDimensions();
	const navigation = useNavigation();
	const currentScreen = ScreenStore.use(
		useCallback((state) => state.screens[key], [key]),
	);
	const handleDismiss = useCallback(
		(screenBeingDismissed: string) => {
			ScreenStore.handleScreenDismiss(screenBeingDismissed, navigation);
		},
		[navigation],
	);
	const initialTouch = useSharedValue({
		x: 0,
		y: 0,
	});

	const translateX = animationValues.gestureX[key];
	const translateY = animationValues.gestureY[key];
	const normalizedGestureX = animationValues.normalizedGestureX[key];
	const normalizedGestureY = animationValues.normalizedGestureY[key];
	const isDragging = animationValues.gestureDragging[key];
	const isDismissing = animationValues.isDismissing[key];
	const progress = animationValues.screenProgress[key] || 0;

	const {
		gestureDirection = DEFAULT_GESTURE_DIRECTION,
		gestureEnabled = DEFAULT_GESTURE_ENABLED,
		transitionSpec = {
			open: DefaultSpec,
			close: DefaultSpec,
		},
		gestureVelocityImpact = GESTURE_VELOCITY_IMPACT,
		gestureResponseDistance = DEFAULT_GESTURE_RESPONSE_DISTANCE,
	} = currentScreen ?? {};

	const directions = Array.isArray(gestureDirection)
		? gestureDirection
		: [gestureDirection];

	const nativeGesture = Gesture.Native();

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

			const minMovement = 5;
			const hasEnoughMovement =
				Math.abs(deltaX) > minMovement || Math.abs(deltaY) > minMovement;

			if (!hasEnoughMovement) return;

			if (isDragging.value) {
				manager.activate();
				return;
			}

			let shouldActivate = false;

			for (const direction of directions) {
				switch (direction) {
					case "vertical":
						if (isSwipingDown) {
							shouldActivate = scrollProgress.value.y <= 0;
						}
						break;

					case "vertical-inverted":
						if (isSwipingUp) {
							const maxScrollableY =
								scrollProgress.value.contentHeight -
								scrollProgress.value.layoutHeight;

							shouldActivate = scrollProgress.value.y >= maxScrollableY;
						}
						break;

					case "horizontal":
						if (isSwipingRight) {
							shouldActivate = scrollProgress.value.x <= 0;
						}
						break;

					case "horizontal-inverted":
						if (isSwipingLeft) {
							const maxProgress =
								scrollProgress.value.contentWidth -
								scrollProgress.value.layoutWidth;

							shouldActivate = scrollProgress.value.x >= maxProgress;
						}
						break;

					case "bidirectional":
						if (isSwipingDown) {
							shouldActivate = scrollProgress.value.y <= 0;
						} else if (isSwipingUp) {
							shouldActivate = scrollProgress.value.y <= 0;
						} else if (isSwipingRight || isSwipingLeft) {
							shouldActivate = true;
						}
						break;
				}

				if (shouldActivate) break;
			}

			if ((shouldActivate || isDragging.value) && !isDismissing.value) {
				manager.activate();
			} else {
				manager.fail();
			}
		},
		[initialTouch, directions, scrollProgress, isDragging, isDismissing],
	);

	const onStart = useCallback(() => {
		"worklet";
		isDragging.value = 1;
		isDismissing.value = 0;
	}, [isDragging, isDismissing]);

	const onUpdate = useCallback(
		(event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			let gestureProgress = 0;

			translateX.value = event.translationX;
			translateY.value = event.translationY;
			normalizedGestureX.value = interpolate(
				event.translationX,
				[-dimensions.width, dimensions.width],
				[-1, 1],
				"clamp",
			);
			normalizedGestureY.value = interpolate(
				event.translationY,
				[-dimensions.height, dimensions.height],
				[-1, 1],
				"clamp",
			);

			if (directions.includes("bidirectional")) {
				const distance = Math.sqrt(
					event.translationX ** 2 + event.translationY ** 2,
				);
				gestureProgress = mapGestureToProgress(distance, dimensions.width);
			} else {
				let maxProgress = 0;

				const allowedDown = directions.includes("vertical");
				const allowedUp = directions.includes("vertical-inverted");
				const allowedRight = directions.includes("horizontal");
				const allowedLeft = directions.includes("horizontal-inverted");

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
			}

			progress.value = 1 - gestureProgress;
		},
		[
			dimensions,
			directions,
			translateX,
			translateY,
			normalizedGestureX,
			normalizedGestureY,
			progress,
		],
	);

	const onEnd = useCallback(
		(event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			const { translationX, translationY, velocityX, velocityY } = event;

			const dismissThreshold = 0.5;

			if (directions.includes("bidirectional")) {
				const finalX = Math.abs(
					translationX + velocityX * gestureVelocityImpact,
				);
				const finalY = Math.abs(
					translationY + velocityY * gestureVelocityImpact,
				);
				const finalDistance = Math.sqrt(finalX ** 2 + finalY ** 2);
				isDismissing.value = Number(
					finalDistance > dimensions.width * dismissThreshold,
				);
			} else {
				const allowedDown = directions.includes("vertical");
				const allowedUp = directions.includes("vertical-inverted");
				const allowedRight = directions.includes("horizontal");
				const allowedLeft = directions.includes("horizontal-inverted");

				if (
					allowedRight &&
					translationX + velocityX * gestureVelocityImpact >
						dimensions.width * dismissThreshold
				) {
					isDismissing.value = 1;
				} else if (
					allowedLeft &&
					-translationX - velocityX * gestureVelocityImpact >
						dimensions.width * dismissThreshold
				) {
					isDismissing.value = 1;
				} else if (
					allowedDown &&
					translationY + velocityY * gestureVelocityImpact >
						dimensions.height * dismissThreshold
				) {
					isDismissing.value = 1;
				} else if (
					allowedUp &&
					-translationY - velocityY * gestureVelocityImpact >
						dimensions.height * dismissThreshold
				) {
					isDismissing.value = 1;
				}
			}

			const finalProgress = isDismissing.value ? 0 : 1;
			const spec = isDismissing.value
				? transitionSpec?.close
				: transitionSpec?.open;

			const onFinish = isDismissing.value
				? (isFinished?: boolean) => {
						"worklet";
						if (isFinished) runOnJS(handleDismiss)(currentScreen?.id);
					}
				: undefined;

			progress.value = animate(finalProgress, spec, onFinish);
			translateX.value = animate(0, spec);
			translateY.value = animate(0, spec);
			normalizedGestureX.value = animate(0, spec);
			normalizedGestureY.value = animate(0, spec);
			isDragging.value = 0;
		},
		[
			dimensions,
			directions,
			translateX,
			translateY,
			normalizedGestureX,
			normalizedGestureY,
			progress,
			handleDismiss,
			currentScreen?.id,
			transitionSpec?.close,
			transitionSpec?.open,
			gestureVelocityImpact,
			isDragging,
			isDismissing,
		],
	);

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(gestureEnabled)
				.manualActivation(true)
				.onTouchesDown(onTouchesDown)
				.onTouchesMove(onTouchesMove)
				.onStart(onStart)
				.onUpdate(onUpdate)
				.onEnd(onEnd)
				.blocksExternalGesture(nativeGesture),
		[
			gestureEnabled,
			nativeGesture,
			onTouchesDown,
			onTouchesMove,
			onStart,
			onUpdate,
			onEnd,
		],
	);

	applyGestureActivationCriteria({
		gestureDirection,
		gestureResponseDistance,
		panGesture,
	});

	return { panGesture, nativeGesture };
};
