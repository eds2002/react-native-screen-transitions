import { useCallback } from "react";
import { useWindowDimensions } from "react-native";
import type { PanGestureEvent } from "react-native-gesture-handler";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import {
	finalizePanRelease,
	startPanBase,
	trackPanGesture,
} from "../helpers/pan-phases";
import type { PanBehavior, PanGestureRuntime } from "../types";
import { PanStrategy } from "./strategies/pan.strategy";
import { SnapPanStrategy } from "./strategies/pan-snap.strategy";

export const usePanBehavior = (runtime: PanGestureRuntime): PanBehavior => {
	const { dismissScreen } = useNavigationHelpers();
	const dimensions = useWindowDimensions();

	const strategy = runtime.config.effectiveSnapPoints.hasSnapPoints
		? SnapPanStrategy
		: PanStrategy;
	const { primeStart, resolveProgress, resolveRelease } = strategy;

	const onStart = useCallback(() => {
		"worklet";
		primeStart(runtime);
		startPanBase(runtime);
	}, [runtime, primeStart]);

	const onUpdate = useCallback(
		(event: PanGestureEvent) => {
			"worklet";
			const track = trackPanGesture(
				event,
				runtime.policy,
				runtime.stores.gestures,
				dimensions,
			);

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
		(event: PanGestureEvent) => {
			"worklet";
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
