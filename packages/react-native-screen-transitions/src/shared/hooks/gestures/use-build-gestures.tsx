import { StackActions } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
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
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	DEFAULT_GESTURE_ENABLED,
	GESTURE_VELOCITY_IMPACT,
} from "../../constants";
import type {
	GestureContextType,
	ScrollConfig,
} from "../../providers/gestures.provider";
import { useKeys } from "../../providers/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { GestureStore, type GestureStoreMap } from "../../stores/gesture.store";

import {
	type GestureDirection,
	GestureOffsetState,
} from "../../types/gesture.types";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";
import { applyOffsetRules } from "../../utils/gesture/check-gesture-activation";
import { determineDismissal } from "../../utils/gesture/determine-dismissal";
import { mapGestureToProgress } from "../../utils/gesture/map-gesture-to-progress";
import { resetGestureValues } from "../../utils/gesture/reset-gesture-values";
import { velocity } from "../../utils/gesture/velocity";
import useStableCallbackValue from "../use-stable-callback-value";

interface BuildGesturesHookProps {
	scrollConfig: SharedValue<ScrollConfig | null>;
	ancestorContext?: GestureContextType | null;
}

export const useBuildGestures = ({
	scrollConfig,
	ancestorContext,
}: BuildGesturesHookProps): {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
	nativeGesture: GestureType;
	gestureAnimationValues: GestureStoreMap;
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

	// Ref for external gesture coordination (e.g., swipeable lists)
	const panGestureRef = useRef<GestureType | undefined>(undefined);

	const gestureAnimationValues = GestureStore.getRouteGestures(
		current.route.key,
	);
	const animations = AnimationStore.getAll(current.route.key);

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

	const handleDismiss = useCallback(() => {
		// If an ancestor navigator is already dismissing, skip this dismiss to
		// avoid racing with the ancestor
		if (ancestorContext?.gestureAnimationValues.isDismissing?.value) {
			return;
		}

		const state = current.navigation.getState();

		const routeStillPresent = state.routes.some(
			(route) => route.key === current.route.key,
		);

		if (!routeStillPresent) {
			return;
		}

		current.navigation.dispatch({
			...StackActions.pop(),
			source: current.route.key,
			target: state.key,
		});
	}, [current, ancestorContext]);

	const onTouchesDown = useStableCallbackValue((e: GestureTouchEvent) => {
		"worklet";
		const firstTouch = e.changedTouches[0];
		initialTouch.value = { x: firstTouch.x, y: firstTouch.y };
		gestureOffsetState.value = GestureOffsetState.PENDING;
	});

	const onTouchesMove = useStableCallbackValue(
		(e: GestureTouchEvent, manager: GestureStateManagerType) => {
			"worklet";

			// If an ancestor navigator is already dismissing via gesture, block new gestures here.
			if (ancestorContext?.gestureAnimationValues.isDismissing?.value) {
				gestureOffsetState.value = GestureOffsetState.FAILED;
				manager.fail();
				return;
			}

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
			if (gestureAnimationValues.isDragging?.value) {
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
			let activatedDirection: GestureDirection | null = null;

			if (recognizedDirection) {
				if (directions.vertical && isSwipingDown) {
					shouldActivate = scrollCfg ? scrollCfg.y <= 0 : true;
					if (shouldActivate) activatedDirection = "vertical";
				}
				if (directions.horizontal && isSwipingRight) {
					shouldActivate = scrollCfg ? scrollCfg.x <= 0 : true;
					if (shouldActivate) activatedDirection = "horizontal";
				}
				if (directions.verticalInverted && isSwipingUp) {
					shouldActivate = scrollCfg ? scrollCfg.y >= maxScrollY : true;
					if (shouldActivate) activatedDirection = "vertical-inverted";
				}
				if (directions.horizontalInverted && isSwipingLeft) {
					shouldActivate = scrollCfg ? scrollCfg.x >= maxScrollX : true;
					if (shouldActivate) activatedDirection = "horizontal-inverted";
				}
			}

			if (recognizedDirection && !shouldActivate) {
				manager.fail();
				return;
			}

			if (
				shouldActivate &&
				gestureOffsetState.value === GestureOffsetState.PASSED &&
				!gestureAnimationValues.isDismissing?.value
			) {
				gestureAnimationValues.direction.value = activatedDirection;
				manager.activate();
				return;
			}
		},
	);

	const onStart = useStableCallbackValue(() => {
		"worklet";
		gestureAnimationValues.isDragging.value = 1;
		gestureAnimationValues.isDismissing.value = 0;
	});

	const onUpdate = useStableCallbackValue(
		(event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			let gestureProgress = 0;

			const { translationX, translationY } = event;
			const { width, height } = dimensions;

			gestureAnimationValues.x.value = translationX;
			gestureAnimationValues.y.value = translationY;
			gestureAnimationValues.normalizedX.value = Math.max(
				-1,
				Math.min(1, translationX / width),
			);
			gestureAnimationValues.normalizedY.value = Math.max(
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
	);

	const onEnd = useStableCallbackValue(
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
				gestures: gestureAnimationValues,
				shouldDismiss,
				event,
				dimensions,
			});

			const initialVelocity = velocity.calculateProgressVelocity({
				animations,
				shouldDismiss,
				event,
				dimensions,
				directions,
			});

			startScreenTransition({
				target: shouldDismiss ? "close" : "open",
				onAnimationFinish: shouldDismiss ? handleDismiss : undefined,
				spec: transitionSpec,
				animations,
				initialVelocity,
			});
		},
	);

	// Memoize gestures to keep stable references - critical for RNGH
	// Child gestures reference ancestor's pan via requireExternalGestureToFail,
	// so the pan gesture MUST be stable or children will reference stale objects
	return useMemo(() => {
		const panGesture = Gesture.Pan()
			.withRef(panGestureRef)
			.enabled(gestureEnabled)
			.manualActivation(true)
			.onTouchesDown(onTouchesDown)
			.onTouchesMove(onTouchesMove)
			.onStart(onStart)
			.onUpdate(onUpdate)
			.onEnd(onEnd);

		// Native gesture setup depends on whether this screen has gestures
		let nativeGesture: GestureType;

		if (gestureEnabled) {
			// This screen has gestures - set up normal pan/native relationship
			nativeGesture = Gesture.Native().requireExternalGestureToFail(panGesture);
			panGesture.blocksExternalGesture(nativeGesture);
		} else {
			// This screen has no gestures
			// Find nearest ancestor with gestureEnabled=true (attached pan)
			let activePanAncestor = ancestorContext;
			while (activePanAncestor && !activePanAncestor.gestureEnabled) {
				activePanAncestor = activePanAncestor.ancestorContext;
			}

			if (activePanAncestor?.panGesture) {
				// Found an ancestor with enabled pan - wait for it
				nativeGesture = Gesture.Native().requireExternalGestureToFail(
					activePanAncestor.panGesture,
				);
			} else {
				// No ancestor with enabled pan - plain native
				nativeGesture = Gesture.Native();
			}
		}

		return {
			panGesture,
			panGestureRef,
			nativeGesture,
			gestureAnimationValues,
		};
	}, [
		gestureEnabled,
		onTouchesDown,
		onTouchesMove,
		onStart,
		onUpdate,
		onEnd,
		gestureAnimationValues,
		ancestorContext,
	]);
};
