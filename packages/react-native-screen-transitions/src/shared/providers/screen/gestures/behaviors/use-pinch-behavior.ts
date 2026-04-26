import { useCallback } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import {
	applyGestureSensitivityToPinchEvent,
	finalizePinchRelease,
	startPinchBase,
	trackPinchGesture,
} from "../helpers/pinch-phases";
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
	return runtime.config.effectiveSnapPoints.hasSnapPoints
		? SnapPinchStrategy
		: PinchStrategy;
};

export const usePinchBehavior = (
	runtime: SharedValue<PinchGestureRuntime>,
): PinchBehavior => {
	const { dismissScreen } = useNavigationHelpers();

	const onStart = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = runtime.get();
			const strategy = getPinchStrategy(latestRuntime);
			strategy.primeStart(latestRuntime, event);
			startPinchBase(latestRuntime, event);
		},
		[runtime],
	);

	const onUpdate = useCallback(
		(rawEvent: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = runtime.get();
			const strategy = getPinchStrategy(latestRuntime);
			const event = applyGestureSensitivityToPinchEvent(
				rawEvent,
				latestRuntime,
			);
			const track = trackPinchGesture(
				event,
				rawEvent,
				latestRuntime.stores.gestures,
			);

			if (!latestRuntime.policy.gestureDrivesProgress) {
				return;
			}

			latestRuntime.stores.animations.progress.set(
				strategy.resolveProgress(event, latestRuntime, track),
			);
		},
		[runtime],
	);

	const onEnd = useCallback(
		(rawEvent: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = runtime.get();
			const strategy = getPinchStrategy(latestRuntime);
			const event = applyGestureSensitivityToPinchEvent(
				rawEvent,
				latestRuntime,
			);
			const release = strategy.resolveRelease(event, latestRuntime);
			finalizePinchRelease(release, latestRuntime, dismissScreen);
		},
		[runtime, dismissScreen],
	);

	return {
		onStart,
		onUpdate,
		onEnd,
	};
};
