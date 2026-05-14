import { useCallback } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import type { ScreenOptionsContextValue } from "../../options";
import { usePinchGestureSensitivity } from "../hooks/use-gesture-sensitivity";
import { resolvePinchRuntime } from "../shared/runtime";
import type {
	PinchBehavior,
	PinchGestureEvent,
	PinchGestureRuntime,
} from "../types";
import {
	finalizePinchRelease,
	startPinchBase,
	trackPinchGesture,
} from "./pinch-lifecycle";
import {
	primeSnapPinchRelease,
	resolvePinchRelease,
	resolveSnapPinchRelease,
} from "./pinch-release";

export const usePinchBehavior = (
	runtime: SharedValue<PinchGestureRuntime>,
	screenOptions: ScreenOptionsContextValue,
): PinchBehavior => {
	const { dismissScreen } = useNavigationHelpers();
	const { withSensitivity, resetSensitivity } =
		usePinchGestureSensitivity(screenOptions);

	const onStart = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			if (latestRuntime.participation.effectiveSnapPoints.hasSnapPoints) {
				primeSnapPinchRelease(latestRuntime);
			}
			startPinchBase(latestRuntime, event);
			resetSensitivity();
		},
		[runtime, screenOptions, resetSensitivity],
	);

	const onUpdate = useCallback(
		(rawEvent: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const event = withSensitivity(rawEvent);
			trackPinchGesture(event, rawEvent, latestRuntime.stores.gestures);
		},
		[runtime, screenOptions, withSensitivity],
	);

	const onEnd = useCallback(
		(rawEvent: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const event = withSensitivity(rawEvent);
			const release = latestRuntime.participation.effectiveSnapPoints
				.hasSnapPoints
				? resolveSnapPinchRelease(event, latestRuntime)
				: resolvePinchRelease(event, latestRuntime);
			finalizePinchRelease(release, latestRuntime, dismissScreen);
		},
		[runtime, screenOptions, dismissScreen, withSensitivity],
	);

	return {
		onStart,
		onUpdate,
		onEnd,
	};
};
