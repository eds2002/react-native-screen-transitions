import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	Gesture,
	type GestureStateChangeEvent,
	type GestureTouchEvent,
	type GestureType,
	type GestureUpdateEvent,
	type PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import {
	runOnJS,
	type SharedValue,
	useSharedValue,
} from "react-native-reanimated";
import type { ScrollConfig } from "../../providers/gestures";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import { Gestures } from "../../stores/gestures";
import { NavigatorDismissState } from "../../stores/navigator-dismiss-state";
import type { ActivationArea } from "../../types/gesture";
import { animate } from "../../utils/animation/animate";
import { runTransition } from "../../utils/animation/run-transition";
import { checkGestureActivation } from "../../utils/gesture/check-gesture-activation";
import { determineDismissal } from "../../utils/gesture/determine-dismissal";
import { mapGestureToProgress } from "../../utils/gesture/map-gesture-to-progress";
import useStableCallback from "../use-stable-callback";

const GESTURE_VELOCITY_IMPACT = 0.3;
const DEFAULT_GESTURE_DIRECTION = "horizontal";
const DEFAULT_GESTURE_ENABLED = false;
const DEFAULT_GESTURE_DRIVES_PROGRESS = true;
const DEFAULT_GESTURE_ACTIVATION_AREA: ActivationArea = "screen";

interface BuildGesturesHookProps {
	scrollConfig: SharedValue<ScrollConfig | null>;
}

export const useBuildGestures = ({
	scrollConfig,
}: BuildGesturesHookProps): {
	panGesture: GestureType;
	nativeGesture: GestureType;
} => {
	const dimensions = useWindowDimensions();
	const { current } = useKeys();

	const initialTouch = useSharedValue({
		x: 0,
		y: 0,
	});
	const gestureActivationState = useSharedValue<
		"pending" | "activated" | "failed"
	>("pending");
	const gestures = Gestures.getRouteGestures(current.route.key);
	const animations = Animations.getAll(current.route.key);

	const {
		gestureDirection = DEFAULT_GESTURE_DIRECTION,
		gestureEnabled = DEFAULT_GESTURE_ENABLED,
		gestureVelocityImpact = GESTURE_VELOCITY_IMPACT,
		gestureDrivesProgress = DEFAULT_GESTURE_DRIVES_PROGRESS,
		gestureActivationArea = DEFAULT_GESTURE_ACTIVATION_AREA,
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

	const setNavigatorDismissal = useStableCallback(() => {
		const key = current.navigation.getState().key;

		NavigatorDismissState.set(key, true);
	});

	const handleDismiss = useStableCallback(() => {
		const key = current.navigation.getState().key;
		current.navigation.goBack();
		NavigatorDismissState.remove(key);
	});

	const onTouchesDown = useCallback(
		(e: GestureTouchEvent) => {
			"worklet";
			const firstTouch = e.changedTouches[0];
			initialTouch.value = { x: firstTouch.x, y: firstTouch.y };
			gestureActivationState.value = "pending";
		},
		[initialTouch, gestureActivationState],
	);

	const onTouchesMove = useCallback(
		(e: GestureTouchEvent, manager: GestureStateManagerType) => {
			"worklet";

			const touch = e.changedTouches[0];

			const { isSwipingDown, isSwipingUp, isSwipingRight, isSwipingLeft } =
				checkGestureActivation({
					touch,
					directions,
					manager,
					dimensions,
					initialTouch: initialTouch.value,
					activationState: gestureActivationState,
					activationArea: gestureActivationArea,
					responseDistance: gestureResponseDistance,
				});

			if (gestureActivationState.value === "failed") {
				return;
			}

			let shouldActivate = false;

			if (gestures.isDragging?.value) {
				manager.activate();
				return;
			}

			const maxScrollableY = scrollConfig.value?.contentHeight
				? scrollConfig.value.contentHeight - scrollConfig.value.layoutHeight
				: 0;
			const maxScrollableX = scrollConfig.value?.contentWidth
				? scrollConfig.value.contentWidth - scrollConfig.value.layoutWidth
				: 0;

			if (directions.vertical && isSwipingDown) {
				if (scrollConfig.value?.y) {
					shouldActivate = scrollConfig.value.y <= 0;
				} else {
					shouldActivate = true;
				}
				gestures.triggerDirection.value = "vertical";
			}
			if (directions.horizontal && isSwipingRight) {
				if (scrollConfig.value) {
					shouldActivate = scrollConfig.value.x <= 0;
				} else {
					shouldActivate = true;
				}
				gestures.triggerDirection.value = "horizontal";
			}

			if (directions.verticalInverted && isSwipingUp) {
				if (scrollConfig.value) {
					shouldActivate = scrollConfig.value.y >= maxScrollableY;
				} else {
					shouldActivate = true;
				}
				gestures.triggerDirection.value = "vertical-inverted";
			}

			if (directions.horizontalInverted && isSwipingLeft) {
				if (scrollConfig.value) {
					shouldActivate = scrollConfig.value.x >= maxScrollableX;
				} else {
					shouldActivate = true;
				}
				gestures.triggerDirection.value = "horizontal-inverted";
			}

			const shouldManagerActivate =
				shouldActivate || gestures.isDragging?.value;

			if (shouldManagerActivate && !gestures.isDismissing?.value) {
				manager.activate();
			} else {
				manager.fail();
			}
		},
		[
			initialTouch,
			scrollConfig,
			gestures,
			directions,
			gestureActivationState,
			dimensions,
			gestureActivationArea,
			gestureResponseDistance,
		],
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

			const { translationX, translationY } = event;
			const { width, height } = dimensions;

			gestures.x.value = translationX;
			gestures.y.value = translationY;
			gestures.normalizedX.value = Math.max(
				-1,
				Math.min(1, translationX / width),
			);
			gestures.normalizedY.value = Math.max(
				-1,
				Math.min(1, translationY / height),
			);

			let maxProgress = 0;

			const allowedDown = directions.vertical;
			const allowedUp = directions.verticalInverted;
			const allowedRight = directions.horizontal;
			const allowedLeft = directions.horizontalInverted;

			if (allowedRight && event.translationX > 0) {
				const currentProgress = mapGestureToProgress(
					translationX,
					dimensions.width,
				);
				maxProgress = Math.max(maxProgress, currentProgress);
			}

			if (allowedLeft && event.translationX < 0) {
				const currentProgress = mapGestureToProgress(
					-translationX,
					dimensions.width,
				);
				maxProgress = Math.max(maxProgress, currentProgress);
			}

			if (allowedDown && event.translationY > 0) {
				const currentProgress = mapGestureToProgress(
					translationY,
					dimensions.height,
				);
				maxProgress = Math.max(maxProgress, currentProgress);
			}

			if (allowedUp && event.translationY < 0) {
				const currentProgress = mapGestureToProgress(
					-translationY,
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

	const onEnd = useCallback(
		(event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			const { shouldDismiss, velocity } = determineDismissal({
				event,
				directions,
				dimensions,
				gestureVelocityImpact,
			});

			const spec = shouldDismiss ? transitionSpec?.close : transitionSpec?.open;

			gestures.isDismissing.value = Number(shouldDismiss);
			gestures.x.value = animate(0, spec);
			gestures.y.value = animate(0, spec);
			gestures.normalizedX.value = animate(0, spec);
			gestures.normalizedY.value = animate(0, spec);
			gestures.isDragging.value = 0;
			gestures.triggerDirection.value = null;

			if (shouldDismiss) {
				runOnJS(setNavigatorDismissal)();
			}

			runTransition({
				target: shouldDismiss ? "close" : "open",
				onFinish: shouldDismiss ? handleDismiss : undefined,
				spec: transitionSpec,
				velocity,
				animations,
			});
		},
		[
			dimensions,
			animations,
			transitionSpec,
			setNavigatorDismissal,
			handleDismiss,
			gestures,
			directions,
			gestureVelocityImpact,
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

		return {
			panGesture,
			nativeGesture,
		};
	}, [gestureEnabled, onTouchesDown, onTouchesMove, onStart, onUpdate, onEnd]);
};
