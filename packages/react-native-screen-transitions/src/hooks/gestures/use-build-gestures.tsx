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
import { type ActivationArea, GestureOffsetState } from "../../types/gesture";
import { animate } from "../../utils/animation/animate";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";
import { applyOffsetRules } from "../../utils/gesture/check-gesture-activation";
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

			const { shouldDismiss, velocity } = determineDismissal({
				event,
				directions,
				dimensions,
				gestureVelocityImpact,
			});

			const spec = shouldDismiss ? transitionSpec?.close : transitionSpec?.open;

			gestures.isDismissing.value = Number(shouldDismiss);

			// Provide per-axis velocities so drag return can bounce naturally
			const vxPx = event.velocityX;
			const vyPx = event.velocityY;
			const vxNorm = vxPx / Math.max(1, dimensions.width);
			const vyNorm = vyPx / Math.max(1, dimensions.height);
			gestures.x.value = animate(0, { ...spec, velocity: vxPx });
			gestures.y.value = animate(0, { ...spec, velocity: vyPx });
			gestures.normalizedX.value = animate(0, { ...spec, velocity: vxNorm });
			gestures.normalizedY.value = animate(0, { ...spec, velocity: vyNorm });
			gestures.isDragging.value = 0;

			if (shouldDismiss) {
				runOnJS(setNavigatorDismissal)();
			}

			startScreenTransition({
				target: shouldDismiss ? "close" : "open",
				onAnimationFinish: shouldDismiss ? handleDismiss : undefined,
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
