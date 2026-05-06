import { useCallback } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import type { ScreenOptionsContextValue } from "../../options";
import {
	finalizePanRelease,
	startPanBase,
	trackPanGesture,
} from "../helpers/pan-phases";
import { resolvePanRuntime } from "../helpers/runtime-options";
import { usePanGestureSensitivity } from "../hooks/use-gesture-sensitivity";
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
	return runtime.participation.effectiveSnapPoints.hasSnapPoints
		? SnapPanStrategy
		: PanStrategy;
};

export const usePanBehavior = (
	runtime: SharedValue<PanGestureRuntime>,
	screenOptions: ScreenOptionsContextValue,
	dimensions: GestureDimensions,
): PanBehavior => {
	const { dismissScreen } = useNavigationHelpers();
	const { withSensitivity, resetSensitivity } =
		usePanGestureSensitivity(screenOptions);

	const onStart = useCallback(() => {
		"worklet";
		const latestRuntime = resolvePanRuntime(runtime.get(), screenOptions.get());
		const strategy = getPanStrategy(latestRuntime);
		strategy.primeStart(latestRuntime);
		startPanBase(latestRuntime);
		resetSensitivity();
	}, [runtime, screenOptions, resetSensitivity]);

	const onUpdate = useCallback(
		(rawEvent: PanGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePanRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const strategy = getPanStrategy(latestRuntime);
			const event = withSensitivity(rawEvent);
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
				strategy.resolveProgress(latestRuntime, dimensions, track),
			);
		},
		[runtime, screenOptions, dimensions, withSensitivity],
	);

	const onEnd = useCallback(
		(rawEvent: PanGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePanRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const strategy = getPanStrategy(latestRuntime);
			const event = withSensitivity(rawEvent);
			const release = strategy.resolveRelease(event, latestRuntime, dimensions);
			finalizePanRelease(release, latestRuntime, dismissScreen);
		},
		[runtime, screenOptions, dimensions, dismissScreen, withSensitivity],
	);

	return {
		onStart,
		onUpdate,
		onEnd,
	};
};
