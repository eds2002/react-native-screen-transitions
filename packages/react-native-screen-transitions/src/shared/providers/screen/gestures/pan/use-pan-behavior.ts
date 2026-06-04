import { useCallback, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import type { ScreenOptionsContextValue } from "../../options";
import { usePanGestureSensitivity } from "../hooks/use-gesture-sensitivity";
import { resolvePanRuntime } from "../shared/runtime";
import type {
	GestureCompositionActivation,
	GestureDimensions,
	PanBehavior,
	PanGestureEvent,
	PanGestureRuntime,
} from "../types";
import {
	finalizePanRelease,
	startPanBase,
	trackPanGesture,
} from "./pan-lifecycle";
import {
	primeSnapPanRelease,
	resolvePanRelease,
	resolveSnapPanRelease,
} from "./pan-release";

export const usePanBehavior = (
	runtime: SharedValue<PanGestureRuntime>,
	screenOptions: ScreenOptionsContextValue,
	dimensions: GestureDimensions,
	gestureCompositionActivation: SharedValue<GestureCompositionActivation>,
): PanBehavior => {
	const { dismissScreen, requestDismiss } = useNavigationHelpers();
	const { withSensitivity, resetSensitivity } =
		usePanGestureSensitivity(screenOptions);

	const onStart = useCallback(() => {
		"worklet";
		const latestRuntime = resolvePanRuntime(runtime.get(), screenOptions.get());
		if (gestureCompositionActivation.get() === "pinch") {
			const { gestures } = latestRuntime.stores;
			gestures.x.set(0);
			gestures.y.set(0);
			gestures.normX.set(0);
			gestures.normY.set(0);
			gestures.velocity.set(0);
			gestures.raw.x.set(0);
			gestures.raw.y.set(0);
			gestures.raw.normX.set(0);
			gestures.raw.normY.set(0);
			resetSensitivity();
			return;
		}

		if (latestRuntime.participation.effectiveSnapPoints.hasSnapPoints) {
			primeSnapPanRelease(latestRuntime);
		}
		startPanBase(latestRuntime);
		resetSensitivity();
	}, [runtime, screenOptions, resetSensitivity, gestureCompositionActivation]);

	const onUpdate = useCallback(
		(rawEvent: PanGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePanRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const event = withSensitivity(rawEvent);
			trackPanGesture(
				event,
				rawEvent,
				latestRuntime.stores.gestures,
				dimensions,
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

			if (gestureCompositionActivation.get() === "pinch") {
				return;
			}

			const event = withSensitivity(rawEvent);
			if (!latestRuntime.policy.enabled) {
				gestureCompositionActivation.set(null);
				return;
			}

			const release = latestRuntime.participation.effectiveSnapPoints
				.hasSnapPoints
				? resolveSnapPanRelease(event, latestRuntime, dimensions)
				: resolvePanRelease(event, latestRuntime, dimensions);

			gestureCompositionActivation.set(null);
			finalizePanRelease(
				release,
				latestRuntime,
				dismissScreen,
				dimensions,
				rawEvent,
				requestDismiss,
			);
		},
		[
			runtime,
			screenOptions,
			dimensions,
			dismissScreen,
			requestDismiss,
			withSensitivity,
			gestureCompositionActivation,
		],
	);

	return useMemo(
		() => ({
			onStart,
			onUpdate,
			onEnd,
		}),
		[onStart, onUpdate, onEnd],
	);
};
