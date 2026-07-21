import { useCallback, useMemo } from "react";
import type {
	GestureStateManager,
	GestureTouchEvent,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { GestureStoreMap } from "../../../../../stores/gesture.store";
import type { ScreenOptionsContextValue } from "../../../options";
import { resolvePinchRuntime } from "../../shared/runtime";
import type { GestureCompositionOwner, PinchGestureRuntime } from "../../types";

export const updateAbsolutePinchFocalPoint = (
	event: GestureTouchEvent,
	gestures: GestureStoreMap,
	captureOrigin: boolean,
) => {
	"worklet";
	const firstTouch = event.allTouches[0];
	const secondTouch = event.allTouches[1];

	if (!firstTouch || !secondTouch) {
		return;
	}

	const focalX = (firstTouch.absoluteX + secondTouch.absoluteX) / 2;
	const focalY = (firstTouch.absoluteY + secondTouch.absoluteY) / 2;

	gestures.focalX.set(focalX);
	gestures.focalY.set(focalY);

	if (captureOrigin) {
		gestures.pinchOriginX.set(focalX);
		gestures.pinchOriginY.set(focalY);
	}
};

interface UsePinchActivationProps {
	runtime: SharedValue<PinchGestureRuntime>;
	screenOptions: ScreenOptionsContextValue;
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>;
}

export const usePinchActivation = ({
	runtime,
	screenOptions,
	gestureCompositionOwner,
}: UsePinchActivationProps) => {
	const onTouchesDown = useCallback(
		(
			event: GestureTouchEvent,
			stateManager: GestureStateManager | undefined,
		) => {
			"worklet";
			const latestRuntime = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const { participation, policy } = latestRuntime;

			if (!participation.canTrackGesture || !policy.enabled) {
				stateManager?.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				updateAbsolutePinchFocalPoint(
					event,
					latestRuntime.stores.gestures,
					true,
				);
				if (gestureCompositionOwner.get() === null) {
					gestureCompositionOwner.set("pinch");
				}
				stateManager?.activate();
				return;
			}

			if (event.numberOfTouches > 2) {
				stateManager?.fail();
			}
		},
		[runtime, screenOptions, gestureCompositionOwner],
	);

	const onTouchesMove = useCallback(
		(event: GestureTouchEvent, stateManager: GestureStateManager) => {
			"worklet";
			const latestRuntime = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const { participation, policy } = latestRuntime;

			if (!participation.canTrackGesture || !policy.enabled) {
				stateManager.fail();
				return;
			}

			if (event.numberOfTouches === 2) {
				updateAbsolutePinchFocalPoint(
					event,
					latestRuntime.stores.gestures,
					false,
				);
				if (gestureCompositionOwner.get() === null) {
					gestureCompositionOwner.set("pinch");
				}
				stateManager.activate();
				return;
			}

			if (event.numberOfTouches > 2) {
				stateManager.fail();
			}
		},
		[runtime, screenOptions, gestureCompositionOwner],
	);

	return useMemo(
		() => ({ onTouchesDown, onTouchesMove }),
		[onTouchesDown, onTouchesMove],
	);
};
