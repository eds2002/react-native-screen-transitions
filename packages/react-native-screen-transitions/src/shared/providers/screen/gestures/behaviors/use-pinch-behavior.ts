import { useCallback } from "react";
import type { PinchGestureEvent } from "react-native-gesture-handler";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import {
	finalizePinchRelease,
	startPinchBase,
	trackPinchGesture,
} from "../helpers/pinch-phases";
import type { PinchBehavior, PinchGestureRuntime } from "../types";
import { PinchStrategy } from "./strategies/pinch.strategy";
import { SnapPinchStrategy } from "./strategies/pinch-snap.strategy";

export const usePinchBehavior = (
	runtime: PinchGestureRuntime,
): PinchBehavior => {
	const { dismissScreen } = useNavigationHelpers();

	const strategy = runtime.config.effectiveSnapPoints.hasSnapPoints
		? SnapPinchStrategy
		: PinchStrategy;
	const { primeStart, resolveProgress, resolveRelease } = strategy;

	const onStart = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";
			primeStart(runtime, event);
			startPinchBase(runtime, event);
		},
		[runtime, primeStart],
	);

	const onUpdate = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";
			const track = trackPinchGesture(
				event,
				runtime.policy,
				runtime.stores.gestures,
			);

			if (!runtime.policy.gestureDrivesProgress) {
				return;
			}

			runtime.stores.animations.progress.set(
				resolveProgress(event, runtime, track),
			);
		},
		[runtime, resolveProgress],
	);

	const onEnd = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";
			const release = resolveRelease(event, runtime);
			finalizePinchRelease(release, runtime, dismissScreen);
		},
		[runtime, dismissScreen, resolveRelease],
	);

	return {
		onStart,
		onUpdate,
		onEnd,
	};
};
