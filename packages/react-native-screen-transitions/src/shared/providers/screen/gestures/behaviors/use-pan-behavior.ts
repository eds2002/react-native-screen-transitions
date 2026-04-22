import { useCallback } from "react";
import { useWindowDimensions } from "react-native";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import {
	finalizePanRelease,
	resolveSensitivePanGestureEvent,
	startPanBase,
	trackPanGesture,
} from "../helpers/pan-phases";
import type { PanBehavior, PanGestureEvent, PanGestureRuntime } from "../types";
import { PanStrategy } from "./strategies/pan.strategy";
import { SnapPanStrategy } from "./strategies/pan-snap.strategy";

export const usePanBehavior = (runtime: PanGestureRuntime): PanBehavior => {
	const { dismissScreen } = useNavigationHelpers();
	const dimensions = useWindowDimensions();

	const { primeStart, resolveProgress, resolveRelease } = runtime.config
		.effectiveSnapPoints.hasSnapPoints
		? SnapPanStrategy
		: PanStrategy;

	const onStart = useCallback(() => {
		"worklet";
		primeStart(runtime);
		startPanBase(runtime);
	}, [runtime, primeStart]);

	const onUpdate = useCallback(
		(rawEvent: PanGestureEvent) => {
			"worklet";
			const event = resolveSensitivePanGestureEvent(rawEvent, runtime.policy);
			const track = trackPanGesture(event, runtime.stores.gestures, dimensions);

			if (!runtime.policy.gestureDrivesProgress) {
				return;
			}

			runtime.stores.animations.progress.set(
				resolveProgress(event, runtime, dimensions, track),
			);
		},
		[runtime, dimensions, resolveProgress],
	);

	const onEnd = useCallback(
		(rawEvent: PanGestureEvent) => {
			"worklet";
			const event = resolveSensitivePanGestureEvent(rawEvent, runtime.policy);
			const release = resolveRelease(event, runtime, dimensions);
			finalizePanRelease(release, runtime, event, dimensions, dismissScreen);
		},
		[runtime, dimensions, dismissScreen, resolveRelease],
	);

	return {
		onStart,
		onUpdate,
		onEnd,
	};
};
