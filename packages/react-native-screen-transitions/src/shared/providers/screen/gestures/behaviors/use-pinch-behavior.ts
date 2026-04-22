import { useCallback } from "react";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import {
	finalizePinchRelease,
	resolveSensitivePinchGestureEvent,
	startPinchBase,
	trackPinchGesture,
} from "../helpers/pinch-phases";
import type {
	PinchBehavior,
	PinchGestureEvent,
	PinchGestureRuntime,
} from "../types";
import { PinchStrategy } from "./strategies/pinch.strategy";
import { SnapPinchStrategy } from "./strategies/pinch-snap.strategy";

export const usePinchBehavior = (
	runtime: PinchGestureRuntime,
): PinchBehavior => {
	const { dismissScreen } = useNavigationHelpers();

	const { primeStart, resolveProgress, resolveRelease } = runtime.config
		.effectiveSnapPoints.hasSnapPoints
		? SnapPinchStrategy
		: PinchStrategy;

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
			const sensitiveEvent = resolveSensitivePinchGestureEvent(
				event,
				runtime.policy,
			);
			const track = trackPinchGesture(sensitiveEvent, runtime.stores.gestures);

			if (!runtime.policy.gestureDrivesProgress) {
				return;
			}

			runtime.stores.animations.progress.set(
				resolveProgress(sensitiveEvent, runtime, track),
			);
		},
		[runtime, resolveProgress],
	);

	const onEnd = useCallback(
		(event: PinchGestureEvent) => {
			"worklet";
			const sensitiveEvent = resolveSensitivePinchGestureEvent(
				event,
				runtime.policy,
			);
			const release = resolveRelease(sensitiveEvent, runtime);
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
