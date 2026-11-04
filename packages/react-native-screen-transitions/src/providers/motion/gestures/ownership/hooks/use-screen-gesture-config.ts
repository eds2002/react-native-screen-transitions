import { useMemo } from "react";
import { useBuilderStore } from "../../../../builder";
import { resolveScreenGestureConfig } from "../../shared/policy";
import type { ScreenGestureConfig } from "../../types";

export function useScreenGestureConfig(): ScreenGestureConfig {
	const options = useBuilderStore((store) => store.options);

	const {
		gestureDirection,
		gestureEnabled,
		gestureReleaseVelocityScale,
		gestureSensitivity,
		gestureSnapLocked,
		gestureSnapVelocityImpact,
		gestureTracking,
		gestureVelocityImpact,
		sheetScrollGestureBehavior,
		sheetSnapBehavior,
		snapPoints,
		transitionSpec,
	} = options;

	const isFirstKey = useBuilderStore((store) => store.derivations.isFirstKey);

	return useMemo(
		() =>
			resolveScreenGestureConfig({
				options: {
					gestureDirection,
					gestureEnabled,
					gestureReleaseVelocityScale,
					gestureSensitivity,
					gestureSnapLocked,
					gestureSnapVelocityImpact,
					gestureTracking,
					gestureVelocityImpact,
					sheetScrollGestureBehavior,
					sheetSnapBehavior,
					snapPoints,
					transitionSpec,
				},
				isFirstKey,
			}),
		[
			isFirstKey,
			gestureDirection,
			gestureEnabled,
			gestureReleaseVelocityScale,
			gestureSensitivity,
			gestureSnapLocked,
			gestureSnapVelocityImpact,
			gestureTracking,
			gestureVelocityImpact,
			sheetScrollGestureBehavior,
			sheetSnapBehavior,
			snapPoints,
			transitionSpec,
		],
	);
}
