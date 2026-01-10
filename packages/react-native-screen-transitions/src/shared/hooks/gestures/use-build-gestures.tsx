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
	FALSE,
	GESTURE_VELOCITY_IMPACT,
	TRUE,
} from "../../constants";
import type {
	GestureContextType,
	ScrollConfig,
} from "../../providers/gestures.provider";
import { useKeys } from "../../providers/screen/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { GestureStore, type GestureStoreMap } from "../../stores/gesture.store";
import {
	type GestureDirection,
	GestureOffsetState,
} from "../../types/gesture.types";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";
import { applyOffsetRules } from "../../utils/gesture/check-gesture-activation";
import { determineDismissal } from "../../utils/gesture/determine-dismissal";
import { determineSnapTarget } from "../../utils/gesture/determine-snap-target";
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
	const navState = current.navigation.getState();
	const isFirstScreen =
		navState.routes.findIndex((r) => r.key === current.route.key) === 0;

	const initialTouch = useSharedValue({
		x: 0,
		y: 0,
	});

	const gestureOffsetState = useSharedValue<GestureOffsetState>(
		GestureOffsetState.PENDING,
	);

	// Captures progress at gesture start for snap point support
	const gestureStartProgress = useSharedValue(1);

	// Ref for external gesture coordination (e.g., swipeable lists)
	const panGestureRef = useRef<GestureType | undefined>(undefined);

	const gestureAnimationValues = GestureStore.getRouteGestures(
		current.route.key,
	);
	const animations = AnimationStore.getAll(current.route.key);

	const {
		gestureDirection = DEFAULT_GESTURE_DIRECTION,
		gestureVelocityImpact = GESTURE_VELOCITY_IMPACT,
		gestureDrivesProgress = DEFAULT_GESTURE_DRIVES_PROGRESS,
		gestureActivationArea = DEFAULT_GESTURE_ACTIVATION_AREA,
		gestureResponseDistance,
		transitionSpec,
		snapPoints,
	} = current.options;

	const hasSnapPoints = Array.isArray(snapPoints) && snapPoints.length > 0;

	const gestureEnabled = Boolean(
		isFirstScreen ? false : current.options.gestureEnabled,
	);

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
		gestureAnimationValues.isDragging.value = TRUE;
		gestureAnimationValues.isDismissing.value = FALSE;
		gestureStartProgress.value = animations.progress.value;
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

			gestureProgress = Math.max(0, Math.min(1, maxProgress));

			if (gestureDrivesProgress) {
				animations.progress.value = Math.max(
					0,
					Math.min(1, gestureStartProgress.value - gestureProgress),
				);
			}
		},
	);

	const onEnd = useStableCallbackValue(
		(event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			let shouldDismiss: boolean;
			let targetProgress: number;

			if (hasSnapPoints) {
				// Use snap point logic
				const result = determineSnapTarget({
					currentProgress: animations.progress.value,
					snapPoints: snapPoints as number[],
					velocityY: event.velocityY,
					screenHeight: dimensions.height,
				});
				shouldDismiss = result.shouldDismiss;
				targetProgress = result.targetProgress;
			} else {
				// Use original dismiss logic
				const result = determineDismissal({
					event,
					directions,
					dimensions,
					gestureVelocityImpact,
				});
				shouldDismiss = result.shouldDismiss;
				targetProgress = shouldDismiss ? 0 : gestureStartProgress.value;
			}

			const isSnapping = hasSnapPoints && !shouldDismiss;

			// Softer spring for snap transitions (including snap-back)
			const SNAP_SPRING = { damping: 50, stiffness: 500, mass: 1 };
			const spec = shouldDismiss ? transitionSpec?.close : transitionSpec?.open;
			const effectiveSpec = isSnapping
				? { open: SNAP_SPRING, close: SNAP_SPRING }
				: transitionSpec;

			resetGestureValues({
				spec,
				gestures: gestureAnimationValues,
				shouldDismiss,
				event,
				dimensions,
			});

			let initialVelocity: number;

			if (isSnapping) {
				// For snap transitions, velocity should match gesture direction
				// Positive velocityY (dragging down) = decreasing progress = negative velocity
				const normalizedVelocityY = event.velocityY / dimensions.height;
				// Clamp to prevent overly energetic springs
				initialVelocity = Math.max(-3, Math.min(3, -normalizedVelocityY));
			} else {
				initialVelocity = velocity.calculateProgressVelocity({
					animations,
					shouldDismiss,
					event,
					dimensions,
					directions,
				});
			}

			startScreenTransition({
				target: shouldDismiss ? "close" : "open",
				onAnimationFinish: shouldDismiss ? handleDismiss : undefined,
				spec: effectiveSpec,
				animations,
				initialVelocity,
				targetProgress,
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
