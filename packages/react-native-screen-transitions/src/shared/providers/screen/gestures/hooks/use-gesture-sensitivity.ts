import { useCallback, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import type { ScreenOptionsContextValue } from "../../options";
import {
	applyGestureSensitivity,
	normalizePinchScale,
} from "../helpers/gesture-physics";
import type { PanGestureEvent, PinchGestureEvent } from "../types";

export interface GestureSensitivityRawChangeState {
	previousRawValue: SharedValue<number>;
	adjustedValue: SharedValue<number>;
}

export const applyGestureSensitivityToRawChange = (
	rawValue: number,
	sensitivity: number,
	state: GestureSensitivityRawChangeState,
) => {
	"worklet";
	const rawChange = rawValue - state.previousRawValue.get();

	// gestureSensitivity can change mid-gesture, so apply it to the latest
	// raw movement only instead of rescaling the recognizer's cumulative value.
	const adjustedValue =
		state.adjustedValue.get() + applyGestureSensitivity(rawChange, sensitivity);

	state.previousRawValue.set(rawValue);
	state.adjustedValue.set(adjustedValue);

	return adjustedValue;
};

const resetChangeState = (state: GestureSensitivityRawChangeState) => {
	"worklet";
	state.previousRawValue.set(0);
	state.adjustedValue.set(0);
};

const useBuildSensitivityChangeState = () => {
	const previousRawValue = useSharedValue(0);
	const adjustedValue = useSharedValue(0);

	return useMemo<GestureSensitivityRawChangeState>(
		() => ({
			previousRawValue,
			adjustedValue,
		}),
		[previousRawValue, adjustedValue],
	);
};

export const usePanGestureSensitivity = (
	screenOptions: ScreenOptionsContextValue,
) => {
	const xSensitivityState = useBuildSensitivityChangeState();
	const ySensitivityState = useBuildSensitivityChangeState();

	const resetSensitivity = useCallback(() => {
		"worklet";
		resetChangeState(xSensitivityState);
		resetChangeState(ySensitivityState);
	}, [xSensitivityState, ySensitivityState]);

	const withSensitivity = useCallback(
		(event: PanGestureEvent): PanGestureEvent => {
			"worklet";
			const sensitivity = screenOptions.get().gestureSensitivity;

			return {
				...event,
				translationX: applyGestureSensitivityToRawChange(
					event.translationX,
					sensitivity,
					xSensitivityState,
				),
				translationY: applyGestureSensitivityToRawChange(
					event.translationY,
					sensitivity,
					ySensitivityState,
				),
			};
		},
		[screenOptions, xSensitivityState, ySensitivityState],
	);

	return useMemo(
		() => ({
			withSensitivity,
			resetSensitivity,
		}),
		[withSensitivity, resetSensitivity],
	);
};

export const usePinchGestureSensitivity = (
	screenOptions: ScreenOptionsContextValue,
) => {
	const scaleSensitivityState = useBuildSensitivityChangeState();

	const resetSensitivity = useCallback(() => {
		"worklet";
		resetChangeState(scaleSensitivityState);
	}, [scaleSensitivityState]);

	const withSensitivity = useCallback(
		(event: PinchGestureEvent): PinchGestureEvent => {
			"worklet";
			const sensitivity = screenOptions.get().gestureSensitivity;
			const normScale = applyGestureSensitivityToRawChange(
				normalizePinchScale(event.scale),
				sensitivity,
				scaleSensitivityState,
			);

			return {
				...event,
				scale: 1 + normScale,
			};
		},
		[screenOptions, scaleSensitivityState],
	);

	return useMemo(
		() => ({
			withSensitivity,
			resetSensitivity,
		}),
		[withSensitivity, resetSensitivity],
	);
};
