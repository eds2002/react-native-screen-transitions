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
import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	DEFAULT_GESTURE_ENABLED,
	GESTURE_VELOCITY_IMPACT,
} from "../../constants";
import type { ScrollConfig } from "../../providers/gestures";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import { Gestures } from "../../stores/gestures";
import { NavigatorDismissState } from "../../stores/navigator-dismiss-state";
import { GestureOffsetState } from "../../types/gesture";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";
import { applyOffsetRules } from "../../utils/gesture/check-gesture-activation";
import { determineDismissal } from "../../utils/gesture/determine-dismissal";
import { mapGestureToProgress } from "../../utils/gesture/map-gesture-to-progress";
import { resetGestureValues } from "../../utils/gesture/reset-gesture-values";
import useStableCallback from "../use-stable-callback";

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
	const gestureOffsetState = useSharedValue<GestureOffsetState>(
		GestureOffsetState.PENDING,
	);

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
			gestureOffsetState.value = GestureOffsetState.PENDING;
		},
		[initialTouch, gestureOffsetState],
	);

	const onTouchesMove = useCallback(
		(e: GestureTouchEvent, manager: GestureStateManagerType) => {
			"worklet";

			const touch = e.changedTouches[0];

			const { isSwipingDown, isSwipingUp, isSwipingRight, isSwipingLeft } =
				applyOffsetRules({
					touch,
					directions,
					manager,
					dimensions,
					gestureOffsetState,
					initialTouch: initialTouch.value,
					activationArea: gestureActivationArea,
					responseDistance: gestureResponseDistance,
				});

			if (gestureOffsetState.value === GestureOffsetState.FAILED) {
				manager.fail();
				return;
			}

			// Keep pending until thresholds are met; no eager activation.
			if (gestures.isDragging?.value) {
				manager.activate();
				return;
			}

			const maxScrollY = scrollConfig.value?.contentHeight
				? scrollConfig.value.contentHeight - scrollConfig.value.layoutHeight
				: 0;

			const maxScrollX = scrollConfig.value?.contentWidth
				? scrollConfig.value.contentWidth - scrollConfig.value.layoutWidth
				: 0;

			const recognizedDirection =
				isSwipingDown || isSwipingUp || isSwipingRight || isSwipingLeft;

			const scrollCfg = scrollConfig.value;

			let shouldActivate = false;
			if (recognizedDirection) {
				if (directions.vertical && isSwipingDown) {
					shouldActivate = scrollCfg ? scrollCfg.y <= 0 : true;
				}
				if (directions.horizontal && isSwipingRight) {
					shouldActivate = scrollCfg ? scrollCfg.x <= 0 : true;
				}
				if (directions.verticalInverted && isSwipingUp) {
					shouldActivate = scrollCfg ? scrollCfg.y >= maxScrollY : true;
				}
				if (directions.horizontalInverted && isSwipingLeft) {
					shouldActivate = scrollCfg ? scrollCfg.x >= maxScrollX : true;
				}
			}

			if (recognizedDirection && !shouldActivate) {
				manager.fail();
				return;
			}

			if (
				shouldActivate &&
				gestureOffsetState.value === GestureOffsetState.PASSED &&
				!gestures.isDismissing?.value
			) {
				manager.activate();
				return;
			}
		},
		[
			initialTouch,
			scrollConfig,
			gestures,
			directions,
			gestureOffsetState,
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

			const { shouldDismiss } = determineDismissal({
				event,
				directions,
				dimensions,
				gestureVelocityImpact,
			});

			const spec = shouldDismiss ? transitionSpec?.close : transitionSpec?.open;

			resetGestureValues({
				spec,
				gestures,
				shouldDismiss,
			});

			if (shouldDismiss) {
				runOnJS(setNavigatorDismissal)();
			}

			startScreenTransition({
				target: shouldDismiss ? "close" : "open",
				onAnimationFinish: shouldDismiss ? handleDismiss : undefined,
				spec: transitionSpec,
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
