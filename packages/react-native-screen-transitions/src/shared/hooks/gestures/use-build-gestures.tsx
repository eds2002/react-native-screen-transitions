import { StackActions } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type {
	GestureContextType,
	ScrollConfig,
} from "../../providers/gestures.provider";
import { useKeys } from "../../providers/screen/keys.provider";
import { useStackCoreContext } from "../../providers/stack/core.provider";
import { GestureStore, type GestureStoreMap } from "../../stores/gesture.store";
import { StackType } from "../../types/stack.types";
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
	const { current } = useKeys();
	const { flags } = useStackCoreContext();
	const isCurrentScreenIsolated = flags.STACK_TYPE === StackType.COMPONENT;

	const navState = current.navigation.getState();

	const isFirstScreen = useMemo(() => {
		return navState.routes.findIndex((r) => r.key === current.route.key) === 0;
	}, [navState.routes, current.route.key]);

	// Ref for external gesture coordination (e.g., swipeable lists)
	const panGestureRef = useRef<GestureType | undefined>(undefined);

	const gestureAnimationValues = GestureStore.getRouteGestures(
		current.route.key,
	);

	const { snapPoints } = current.options;

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
			scrollConfig,
			canDismiss,
			handleDismiss,
			ancestorIsDismissing:
				ancestorContext?.gestureAnimationValues.isDismissing,
		});

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

		// Collect ALL ancestor pan gestures, respecting isolation boundaries
		// This applies regardless of whether this screen has gestures
		const ancestorPanGestures: GestureType[] = [];
		let currentAncestor = ancestorContext;

		while (currentAncestor) {
			// Stop at isolation boundary: we're isolated, ancestor is not
			if (isCurrentScreenIsolated && !currentAncestor.isIsolated) {
				break;
			}

			if (currentAncestor.gestureEnabled && currentAncestor.panGesture) {
				ancestorPanGestures.push(currentAncestor.panGesture);
			}

			currentAncestor = currentAncestor.ancestorContext;
		}

		const nativeGesture: GestureType = Gesture.Native();

		if (gestureEnabled) {
			// This screen has gestures - native waits for this pan first
			nativeGesture.requireExternalGestureToFail(panGesture);
			panGesture.blocksExternalGesture(nativeGesture);
		}

		// Chain all ancestor pan gestures - native waits for all to fail
		for (const ancestorPan of ancestorPanGestures) {
			nativeGesture.requireExternalGestureToFail(ancestorPan);
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
		isCurrentScreenIsolated,
	]);
};
