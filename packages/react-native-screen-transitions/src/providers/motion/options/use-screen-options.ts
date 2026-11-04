import { useLayoutEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import { useBuilderStore } from "../../builder";
import { resolveBaseScreenOptions, syncScreenOptionsBase } from "./helpers";
import type { ScreenOptionsContextValue, ScreenOptionsState } from "./types";

export function useScreenOptions(): ScreenOptionsContextValue {
	const options = useBuilderStore((store) => store.options);

	const {
		gestureEnabled,
		gestureTracking,
		gestureDirection,
		gestureSensitivity,
		gestureVelocityImpact,
		gestureSnapVelocityImpact,
		gestureReleaseVelocityScale,
		gestureSnapLocked,
		sheetSnapBehavior,
		sheetScrollGestureBehavior,
		backdropBehavior,
		transitionSpec,
	} = options;

	const baseScreenOptions = useMemo(
		() =>
			resolveBaseScreenOptions({
				gestureEnabled,
				gestureTracking,
				gestureDirection,
				gestureSensitivity,
				gestureVelocityImpact,
				gestureSnapVelocityImpact,
				gestureReleaseVelocityScale,
				gestureSnapLocked,
				sheetSnapBehavior,
				sheetScrollGestureBehavior,
				backdropBehavior,
				transitionSpec,
			}),
		[
			gestureEnabled,
			gestureTracking,
			gestureDirection,
			gestureSensitivity,
			gestureVelocityImpact,
			gestureSnapVelocityImpact,
			gestureReleaseVelocityScale,
			gestureSnapLocked,
			sheetSnapBehavior,
			sheetScrollGestureBehavior,
			backdropBehavior,
			transitionSpec,
		],
	);

	const initialScreenOptions = useMemo<ScreenOptionsState>(
		() => ({
			...baseScreenOptions,
			baseOptions: baseScreenOptions,
		}),
		[baseScreenOptions],
	);

	const value = useSharedValue(initialScreenOptions);

	useLayoutEffect(() => {
		syncScreenOptionsBase(value, baseScreenOptions);
	}, [value, baseScreenOptions]);

	return value;
}
