import { useCallback } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import type { ScreenOptionsContextValue } from "../../options";
import {
	finalizePinchRelease,
	startPinchBase,
	trackPinchGesture,
} from "../helpers/pinch-phases";
import { resolvePinchRuntime } from "../helpers/runtime-options";
import { usePinchGestureSensitivity } from "../hooks/use-gesture-sensitivity";
import type {
	PinchBehavior,
	PinchBehaviorStrategy,
	PinchGestureEvent,
	PinchGestureRuntime,
} from "../types";
import { PinchStrategy } from "./strategies/pinch.strategy";
import { SnapPinchStrategy } from "./strategies/pinch-snap.strategy";

const getPinchStrategy = (
	runtime: PinchGestureRuntime,
): PinchBehaviorStrategy => {
	"worklet";
	return runtime.participation.effectiveSnapPoints.hasSnapPoints
		? SnapPinchStrategy
		: PinchStrategy;
};

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
			const strategy = getPinchStrategy(latestRuntime);
			strategy.primeStart(latestRuntime);
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
			const strategy = getPinchStrategy(latestRuntime);
			const event = withSensitivity(rawEvent);
			const release = strategy.resolveRelease(event, latestRuntime);
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
