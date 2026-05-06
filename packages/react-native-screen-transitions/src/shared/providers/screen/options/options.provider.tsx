import { useLayoutEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import createProvider from "../../../utils/create-provider";
import { useDescriptors } from "../descriptors";
import { resolveBaseScreenOptions, syncScreenOptionsBase } from "./helpers";
import type {
	ScreenOptionsContextValue,
	ScreenOptionsProviderProps,
} from "./types";

export const { ScreenOptionsProvider, useScreenOptionsContext } =
	createProvider("ScreenOptions")<
		ScreenOptionsProviderProps,
		ScreenOptionsContextValue
	>(() => {
		const {
			current: { options },
		} = useDescriptors();

		const baseScreenOptions = useMemo(
			() => resolveBaseScreenOptions(options),
			[options],
		);

		const gestureEnabled = useSharedValue(baseScreenOptions.gestureEnabled);
		const experimental_allowDisabledGestureTracking = useSharedValue(
			baseScreenOptions.experimental_allowDisabledGestureTracking,
		);
		const gestureDirection = useSharedValue(baseScreenOptions.gestureDirection);
		const gestureSensitivity = useSharedValue(
			baseScreenOptions.gestureSensitivity,
		);
		const gestureVelocityImpact = useSharedValue(
			baseScreenOptions.gestureVelocityImpact,
		);
		const gestureSnapVelocityImpact = useSharedValue(
			baseScreenOptions.gestureSnapVelocityImpact,
		);
		const gestureReleaseVelocityScale = useSharedValue(
			baseScreenOptions.gestureReleaseVelocityScale,
		);
		const gestureResponseDistance = useSharedValue(
			baseScreenOptions.gestureResponseDistance,
		);
		const gestureDrivesProgress = useSharedValue(
			baseScreenOptions.gestureDrivesProgress,
		);
		const gestureActivationArea = useSharedValue(
			baseScreenOptions.gestureActivationArea,
		);
		const gestureSnapLocked = useSharedValue(
			baseScreenOptions.gestureSnapLocked,
		);
		const sheetScrollGestureBehavior = useSharedValue(
			baseScreenOptions.sheetScrollGestureBehavior,
		);
		const backdropBehavior = useSharedValue(baseScreenOptions.backdropBehavior);
		const baseOptions = useSharedValue(baseScreenOptions);

		const value = useMemo<ScreenOptionsContextValue>(
			() => ({
				gestureEnabled,
				experimental_allowDisabledGestureTracking,
				gestureDirection,
				gestureSensitivity,
				gestureVelocityImpact,
				gestureSnapVelocityImpact,
				gestureReleaseVelocityScale,
				gestureResponseDistance,
				gestureDrivesProgress,
				gestureActivationArea,
				gestureSnapLocked,
				sheetScrollGestureBehavior,
				backdropBehavior,
				baseOptions,
			}),
			[
				gestureEnabled,
				experimental_allowDisabledGestureTracking,
				gestureDirection,
				gestureSensitivity,
				gestureVelocityImpact,
				gestureSnapVelocityImpact,
				gestureReleaseVelocityScale,
				gestureResponseDistance,
				gestureDrivesProgress,
				gestureActivationArea,
				gestureSnapLocked,
				sheetScrollGestureBehavior,
				backdropBehavior,
				baseOptions,
			],
		);

		useLayoutEffect(() => {
			syncScreenOptionsBase(value, baseScreenOptions);
		}, [value, baseScreenOptions]);

		return {
			value,
		};
	});
