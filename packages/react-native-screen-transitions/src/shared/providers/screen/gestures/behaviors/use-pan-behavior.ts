import { useCallback } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import {
	applyGestureSensitivityToPanEvent,
	finalizePanRelease,
	startPanBase,
	trackPanGesture,
} from "../helpers/pan-phases";
import type {
	GestureDimensions,
	PanBehavior,
	PanBehaviorStrategy,
	PanGestureEvent,
	PanGestureRuntime,
} from "../types";
import { PanStrategy } from "./strategies/pan.strategy";
import { SnapPanStrategy } from "./strategies/pan-snap.strategy";

const getPanStrategy = (runtime: PanGestureRuntime): PanBehaviorStrategy => {
	"worklet";
	return runtime.config.effectiveSnapPoints.hasSnapPoints
		? SnapPanStrategy
		: PanStrategy;
};

export const usePanBehavior = (
	runtime: SharedValue<PanGestureRuntime>,
	dimensions: GestureDimensions,
): PanBehavior => {
	const { dismissScreen } = useNavigationHelpers();

	const onStart = useCallback(() => {
		"worklet";
		const latestRuntime = runtime.get();
		const strategy = getPanStrategy(latestRuntime);
		strategy.primeStart(latestRuntime);
		startPanBase(latestRuntime);
	}, [runtime]);

	const onUpdate = useCallback(
		(rawEvent: PanGestureEvent) => {
			"worklet";
			const latestRuntime = runtime.get();
			const strategy = getPanStrategy(latestRuntime);
			const event = applyGestureSensitivityToPanEvent(rawEvent, latestRuntime);
			const track = trackPanGesture(
				event,
				rawEvent,
				latestRuntime.stores.gestures,
				dimensions,
			);

			if (!latestRuntime.policy.gestureDrivesProgress) {
				return;
			}

			latestRuntime.stores.animations.progress.set(
				strategy.resolveProgress(event, latestRuntime, dimensions, track),
			);
		},
		[runtime, dimensions],
	);

	const onEnd = useCallback(
		(rawEvent: PanGestureEvent) => {
			"worklet";
			const latestRuntime = runtime.get();
			const strategy = getPanStrategy(latestRuntime);
			const event = applyGestureSensitivityToPanEvent(rawEvent, latestRuntime);
			const release = strategy.resolveRelease(event, latestRuntime, dimensions);
			finalizePanRelease(
				release,
				latestRuntime,
				event,
				dimensions,
				dismissScreen,
			);
		},
		[runtime, dimensions, dismissScreen],
	);

	return {
		onStart,
		onUpdate,
		onEnd,
	};
};
