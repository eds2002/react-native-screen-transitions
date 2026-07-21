import { useCallback, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../../hooks/navigation/use-navigation-helpers";
import type { Direction } from "../../../../../types/ownership.types";
import type { ScreenOptionsContextValue } from "../../../options";
import { usePanGestureSensitivity } from "../../hooks/use-gesture-sensitivity";
import { resolvePanRuntime } from "../../shared/runtime";
import { clearPanTrackingValues } from "../../shared/values";
import type {
	GestureCompositionOwner,
	GestureDimensions,
	PanBehavior,
	PanGestureEvent,
	PanGestureRuntime,
} from "../../types";
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
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>,
	pendingDirection: SharedValue<Direction | null>,
): PanBehavior => {
	const { dismissScreen, requestDismiss } = useNavigationHelpers();
	const { withSensitivity, resetSensitivity } =
		usePanGestureSensitivity(screenOptions);

	const onStart = useCallback(() => {
		"worklet";
		const latestRuntime = resolvePanRuntime(runtime.get(), screenOptions.get());
		if (gestureCompositionOwner.get() === "pinch") {
			clearPanTrackingValues(latestRuntime.stores.gestures);
			pendingDirection.set(null);
			resetSensitivity();
			return;
		}

		const direction = pendingDirection.get();
		if (direction) {
			latestRuntime.stores.gestures.active.set(direction);
			latestRuntime.stores.gestures.direction.set(direction);
		}
		pendingDirection.set(null);
		gestureCompositionOwner.set("pan");

		if (latestRuntime.participation.effectiveSnapPoints.hasSnapPoints) {
			primeSnapPanRelease(latestRuntime);
		}
		startPanBase(latestRuntime);
		resetSensitivity();
	}, [
		runtime,
		screenOptions,
		resetSensitivity,
		gestureCompositionOwner,
		pendingDirection,
	]);

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
			const event = withSensitivity(rawEvent);

			const release = !latestRuntime.policy.enabled
				? {
						target: latestRuntime.stores.animations.transitionProgress.get(),
						shouldDismiss: false,
						initialVelocity: 0,
						transitionSpec: undefined,
						resetSpec: latestRuntime.policy.transitionSpec?.open,
					}
				: latestRuntime.participation.effectiveSnapPoints.hasSnapPoints
					? resolveSnapPanRelease(event, latestRuntime, dimensions)
					: resolvePanRelease(event, latestRuntime, dimensions);
			const isPanCompositionOwner = gestureCompositionOwner.get() === "pan";

			finalizePanRelease(
				release,
				latestRuntime,
				dismissScreen,
				dimensions,
				rawEvent,
				requestDismiss,
				gestureCompositionOwner,
			);

			if (isPanCompositionOwner) {
				gestureCompositionOwner.set(null);
			}
		},
		[
			runtime,
			screenOptions,
			dimensions,
			dismissScreen,
			requestDismiss,
			withSensitivity,
			gestureCompositionOwner,
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
