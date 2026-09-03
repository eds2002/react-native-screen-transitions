import { useCallback, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../../hooks/navigation/use-navigation-helpers";
import type { Direction } from "../../../../../types/ownership.types";
import {
	allocateClipGestureReleaseIdOnUI,
	type ClipStreamCanonicalSnapshot,
	scheduleClipStreamRouteFlushOnUI,
} from "../../../clip/clip-stream-ui";
import {
	globalSmoothClipCoordinatorRuntime,
	INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION,
} from "../../../clips/coordinator/runtime-store";
import { useDescriptorDerivations } from "../../../descriptors";
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
	trackPanGestureAndFlush,
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
	const { currentScreenKey } = useDescriptorDerivations();
	const { withSensitivity, resetSensitivity } =
		usePanGestureSensitivity(screenOptions);
	const beginSmoothClipRelease = useCallback(
		(
			completionId: number,
			snapshots: readonly ClipStreamCanonicalSnapshot[],
			currentProgress: number,
			targetProgress: number,
			progressVelocity: number,
			animation:
				| Parameters<
						typeof globalSmoothClipCoordinatorRuntime.requestRecordedBuiltInPromotion
				  >[0]["animation"]
				| null,
		) => {
			globalSmoothClipCoordinatorRuntime.beginGestureRelease({
				completionId,
				onTeardown: () => {
					dismissScreen();
				},
				requiresReset: true,
				routeKey: currentScreenKey,
				snapshots,
			});
			if (animation) {
				const distance = targetProgress - currentProgress;
				const nativeAnimation =
					Math.abs(distance) < 1e-6
						? {
								type: "timing" as const,
								duration: 0,
								controlPoints: [0, 0, 1, 1] as const,
							}
						: animation.type === "spring"
							? { ...animation, velocity: progressVelocity / distance }
							: animation;
				void globalSmoothClipCoordinatorRuntime.requestRecordedBuiltInPromotion(
					{
						animation: nativeAnimation,
						routeKey: currentScreenKey,
						source: "gesture-release",
						targetProgress,
					},
				);
			}
		},
		[currentScreenKey, dismissScreen],
	);
	const completeSmoothClipReanimated = useCallback(
		(completionId: number, finished: boolean) => {
			globalSmoothClipCoordinatorRuntime.completeReanimated(
				completionId,
				finished,
			);
		},
		[],
	);
	const completeSmoothClipReset = useCallback(
		(completionId: number, finished: boolean) => {
			globalSmoothClipCoordinatorRuntime.completeReset(completionId, finished);
		},
		[],
	);

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
			trackPanGestureAndFlush(
				event,
				rawEvent,
				latestRuntime.stores.gestures,
				dimensions,
				currentScreenKey,
			);
		},
		[runtime, screenOptions, dimensions, withSensitivity, currentScreenKey],
	);

	const onEnd = useCallback(
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
			scheduleClipStreamRouteFlushOnUI(
				currentScreenKey,
				(finalClipSnapshots) => {
					"worklet";
					const completionId = INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION
						? allocateClipGestureReleaseIdOnUI()
						: undefined;

					finalizePanRelease(
						release,
						latestRuntime,
						dismissScreen,
						dimensions,
						rawEvent,
						requestDismiss,
						gestureCompositionOwner,
						completionId === undefined
							? undefined
							: {
									begin: beginSmoothClipRelease,
									completeReanimated: completeSmoothClipReanimated,
									completeReset: completeSmoothClipReset,
									completionId,
									snapshots: finalClipSnapshots,
								},
					);

					if (isPanCompositionOwner) {
						gestureCompositionOwner.set(null);
					}
				},
			);
		},
		[
			runtime,
			screenOptions,
			dimensions,
			dismissScreen,
			requestDismiss,
			withSensitivity,
			gestureCompositionOwner,
			currentScreenKey,
			beginSmoothClipRelease,
			completeSmoothClipReanimated,
			completeSmoothClipReset,
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
