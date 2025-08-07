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
import { animate } from "../../utils/animation/animate";
import { applyGestureActivationCriteria } from "../../utils/gesture/apply-gesture-activation-criteria";
import { mapGestureToProgress } from "../../utils/gesture/map-gesture-to-progress";
import type { ScrollProgress } from "../context/gestures";
import { useKeys } from "../context/keys";
import { Animations } from "../stores/animations";
import { Gestures } from "../stores/gestures";
import { NavigatorDismissState } from "../stores/navigator-dismiss-state";
import { runTransition } from "../utils/animations/run-transition";

const GESTURE_VELOCITY_IMPACT = 0.3;
const DEFAULT_GESTURE_RESPONSE_DISTANCE = 50;
const DEFAULT_GESTURE_DIRECTION = "horizontal";
const DEFAULT_GESTURE_ENABLED = false;
const DEFAULT_GESTURE_DRIVES_PROGRESS = true;

interface BuildGesturesHookProps {
	scrollProgress: SharedValue<ScrollProgress>;
}

export const useBuildGestures = ({
	scrollProgress,
}: BuildGesturesHookProps) => {
	const dimensions = useWindowDimensions();
	const { current } = useKeys();

	const initialTouch = useSharedValue({
		x: 0,
		y: 0,
	});

	const gestures = Gestures.getRouteGestures(current.route.key);

	const animations = Animations.getAll(current.route.key);

	const {
		gestureDirection = DEFAULT_GESTURE_DIRECTION,
		gestureEnabled = DEFAULT_GESTURE_ENABLED,
		transitionSpec,
		gestureVelocityImpact = GESTURE_VELOCITY_IMPACT,
		gestureResponseDistance = DEFAULT_GESTURE_RESPONSE_DISTANCE,
		gestureDrivesProgress = DEFAULT_GESTURE_DRIVES_PROGRESS,
	} = current.options;

	const directions = Array.isArray(gestureDirection)
		? gestureDirection
		: [gestureDirection];

	const allowed = useMemo(
		() => ({
			bidirectional: directions.includes("bidirectional"),
			vertical: directions.includes("vertical"),
			verticalInverted: directions.includes("vertical-inverted"),
			horizontal: directions.includes("horizontal"),
			horizontalInverted: directions.includes("horizontal-inverted"),
		}),
		[directions],
	);

	const nativeGesture = useMemo(() => Gesture.Native(), []);

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

			if (gestures.isDragging?.value) {
				manager.activate();
				return;
			}

			let shouldActivate = false;

			if (allowed.vertical && isSwipingDown) {
				shouldActivate = scrollProgress.value.y <= 0;
			}
			if (allowed.verticalInverted && isSwipingUp) {
				const maxScrollableY =
					scrollProgress.value.contentHeight -
					scrollProgress.value.layoutHeight;

				shouldActivate = scrollProgress.value.y >= maxScrollableY;
			}
			if (allowed.horizontal && isSwipingRight) {
				shouldActivate = scrollProgress.value.x <= 0;
			}
			if (allowed.horizontalInverted && isSwipingLeft) {
				const maxProgress =
					scrollProgress.value.contentWidth - scrollProgress.value.layoutWidth;
				shouldActivate = scrollProgress.value.x >= maxProgress;
			}
			if (allowed.bidirectional) {
				if (isSwipingDown) {
					shouldActivate = scrollProgress.value.y >= 0;
				} else if (isSwipingUp) {
					shouldActivate = scrollProgress.value.y <= 0;
				} else if (isSwipingRight || isSwipingLeft) {
					shouldActivate = true;
				}
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
		[initialTouch, scrollProgress, gestures, allowed],
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

			if (allowed.bidirectional) {
				const distance = Math.sqrt(
					event.translationX ** 2 + event.translationY ** 2,
				);
				gestureProgress = mapGestureToProgress(distance, dimensions.width);
			} else {
				let maxProgress = 0;

				const allowedDown = allowed.vertical;
				const allowedUp = allowed.verticalInverted;
				const allowedRight = allowed.horizontal;
				const allowedLeft = allowed.horizontalInverted;

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

			if (gestureDrivesProgress) {
				animations.progress.value = 1 - gestureProgress;
			}
		},
		[dimensions, gestures, animations, gestureDrivesProgress, allowed],
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

			const dismissThreshold = 0.5;

			const finalX = translationX + velocityX * gestureVelocityImpact;
			const finalY = translationY + velocityY * gestureVelocityImpact;
			const finalDistance = Math.sqrt(finalX * finalX + finalY * finalY);

			const diagonal = Math.sqrt(
				dimensions.width * dimensions.width +
					dimensions.height * dimensions.height,
			);

			gestures.isDismissing.value = Number(
				finalDistance > diagonal * dismissThreshold,
			);

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
		},
		[
			dimensions,
			animations,
			transitionSpec,
			gestureVelocityImpact,
			setNavigatorDismissal,
			handleDismiss,
			gestures,
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
