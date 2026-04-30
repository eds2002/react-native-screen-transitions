import { useCallback } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import {
	finalizePinchRelease,
	startPinchBase,
	trackPinchGesture,
} from "../helpers/pinch-phases";
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
): PinchBehavior => {
	const { dismissScreen } = useNavigationHelpers();
	const { withSensitivity, resetSensitivity } =
		usePinchGestureSensitivity(runtime);

	const onStart = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = runtime.get();
			const strategy = getPinchStrategy(latestRuntime);
			strategy.primeStart(latestRuntime);
			startPinchBase(latestRuntime, event);
			resetSensitivity();
		},
		[runtime, resetSensitivity],
	);

	const onUpdate = useCallback(
		(rawEvent: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = runtime.get();
			const strategy = getPinchStrategy(latestRuntime);
			const event = withSensitivity(rawEvent);
			const track = trackPinchGesture(
				event,
				rawEvent,
				latestRuntime.stores.gestures,
			);

			if (!latestRuntime.policy.gestureDrivesProgress) {
				return;
			}

			latestRuntime.stores.animations.progress.set(
				strategy.resolveProgress(latestRuntime, track),
			);
		},
		[runtime, withSensitivity],
	);

	const onEnd = useCallback(
		(rawEvent: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = runtime.get();
			const strategy = getPinchStrategy(latestRuntime);
			const event = withSensitivity(rawEvent);
			const release = strategy.resolveRelease(event, latestRuntime);
			finalizePinchRelease(release, latestRuntime, dismissScreen);
		},
		[runtime, dismissScreen, withSensitivity],
	);

	return {
		onStart,
		onUpdate,
		onEnd,
	};
};
