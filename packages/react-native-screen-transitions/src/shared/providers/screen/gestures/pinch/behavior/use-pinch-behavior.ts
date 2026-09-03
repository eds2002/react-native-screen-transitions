import { useCallback, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useNavigationHelpers } from "../../../../../hooks/navigation/use-navigation-helpers";
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
import { usePinchGestureSensitivity } from "../../hooks/use-gesture-sensitivity";
import { resolvePinchRuntime } from "../../shared/runtime";
import type {
	GestureCompositionOwner,
	PinchBehavior,
	PinchGestureEvent,
	PinchGestureRuntime,
} from "../../types";
import {
	finalizePinchRelease,
	startPinchBase,
	trackPinchGesture,
	trackPinchGestureAndFlush,
} from "./pinch-lifecycle";
import {
	primeSnapPinchRelease,
	resolvePinchRelease,
	resolveSnapPinchRelease,
} from "./pinch-release";

export const usePinchBehavior = (
	runtime: SharedValue<PinchGestureRuntime>,
	screenOptions: ScreenOptionsContextValue,
	gestureCompositionOwner: SharedValue<GestureCompositionOwner>,
): PinchBehavior => {
	const { dismissScreen, requestDismiss } = useNavigationHelpers();
	const { currentScreenKey } = useDescriptorDerivations();
	const { withSensitivity, resetSensitivity } =
		usePinchGestureSensitivity(screenOptions);
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
		const latestRuntime = resolvePinchRuntime(
			runtime.get(),
			screenOptions.get(),
		);
		if (latestRuntime.participation.effectiveSnapPoints.hasSnapPoints) {
			primeSnapPinchRelease(latestRuntime);
		}
		startPinchBase(latestRuntime);
		resetSensitivity();
	}, [runtime, screenOptions, resetSensitivity]);

	const onUpdate = useCallback(
		(rawEvent: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const event = withSensitivity(rawEvent);
			trackPinchGestureAndFlush(
				event,
				rawEvent,
				latestRuntime.stores.gestures,
				currentScreenKey,
			);
		},
		[runtime, screenOptions, withSensitivity, currentScreenKey],
	);

	const onEnd = useCallback(
		(rawEvent: PinchGestureEvent) => {
			"worklet";
			const latestRuntime = resolvePinchRuntime(
				runtime.get(),
				screenOptions.get(),
			);
			const event = withSensitivity(rawEvent);
			trackPinchGesture(event, rawEvent, latestRuntime.stores.gestures);
			const release = latestRuntime.participation.effectiveSnapPoints
				.hasSnapPoints
				? resolveSnapPinchRelease(event, latestRuntime)
				: resolvePinchRelease(event, latestRuntime);
			scheduleClipStreamRouteFlushOnUI(
				currentScreenKey,
				(finalClipSnapshots) => {
					"worklet";
					const completionId = INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION
						? allocateClipGestureReleaseIdOnUI()
						: undefined;
					finalizePinchRelease(
						release,
						latestRuntime,
						dismissScreen,
						requestDismiss,
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
					gestureCompositionOwner.set(null);
				},
			);
		},
		[
			runtime,
			screenOptions,
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
