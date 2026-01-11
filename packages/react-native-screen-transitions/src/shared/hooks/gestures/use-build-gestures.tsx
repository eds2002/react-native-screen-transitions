import { StackActions } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
import { useWindowDimensions } from "react-native";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	GESTURE_VELOCITY_IMPACT,
} from "../../constants";
import type {
	GestureContextType,
	ScrollConfig,
} from "../../providers/gestures.provider";
import { useKeys } from "../../providers/screen/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { GestureStore, type GestureStoreMap } from "../../stores/gesture.store";
import { useScreenGestureHandlers } from "./use-screen-gesture-handlers";

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

	const isFirstScreen = useMemo(() => {
		return navState.routes.findIndex((r) => r.key === current.route.key) === 0;
	}, [navState.routes, current.route.key]);

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

	// Dismiss gesture is controlled by gestureEnabled (disabled for first screen)
	const canDismiss = Boolean(
		isFirstScreen ? false : current.options.gestureEnabled,
	);

	// Snap navigation works independently - enabled when snap points exist
	// This matches iOS native sheet behavior where gestureEnabled: false
	// disables dismiss but you can still drag between detents
	const hasSnapPoints = Array.isArray(snapPoints) && snapPoints.length > 0;
	const gestureEnabled = canDismiss || hasSnapPoints;

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

	const { onTouchesDown, onTouchesMove, onStart, onUpdate, onEnd } =
		useScreenGestureHandlers({
			dimensions,
			animations,
			gestureAnimationValues,
			gestureDirection,
			gestureDrivesProgress,
			gestureVelocityImpact,
			scrollConfig,
			gestureActivationArea,
			gestureResponseDistance,
			ancestorIsDismissing:
				ancestorContext?.gestureAnimationValues.isDismissing,
			snapPoints,
			canDismiss,
			transitionSpec,
			handleDismiss,
		});

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
