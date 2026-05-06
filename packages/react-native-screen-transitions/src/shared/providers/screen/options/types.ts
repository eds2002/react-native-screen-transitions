import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenTransitionOptions } from "../../../types";

export type RuntimeOption<T> = SharedValue<T>;
export type RequiredScreenOption<K extends keyof ScreenTransitionOptions> =
	NonNullable<ScreenTransitionOptions[K]>;
export type OptionalScreenOption<K extends keyof ScreenTransitionOptions> =
	ScreenTransitionOptions[K];

export type ScreenOptionsSnapshot = {
	gestureEnabled: OptionalScreenOption<"gestureEnabled">;
	experimental_allowDisabledGestureTracking: RequiredScreenOption<"experimental_allowDisabledGestureTracking">;
	gestureDirection: RequiredScreenOption<"gestureDirection">;
	gestureSensitivity: RequiredScreenOption<"gestureSensitivity">;
	gestureVelocityImpact: RequiredScreenOption<"gestureVelocityImpact">;
	gestureSnapVelocityImpact: RequiredScreenOption<"gestureSnapVelocityImpact">;
	gestureReleaseVelocityScale: RequiredScreenOption<"gestureReleaseVelocityScale">;
	gestureResponseDistance: OptionalScreenOption<"gestureResponseDistance">;
	gestureDrivesProgress: RequiredScreenOption<"gestureDrivesProgress">;
	gestureActivationArea: RequiredScreenOption<"gestureActivationArea">;
	gestureSnapLocked: RequiredScreenOption<"gestureSnapLocked">;
	sheetScrollGestureBehavior: RequiredScreenOption<"sheetScrollGestureBehavior">;
	backdropBehavior: OptionalScreenOption<"backdropBehavior">;
};

export type ScreenOptionsContextValue = {
	gestureEnabled: RuntimeOption<ScreenOptionsSnapshot["gestureEnabled"]>;
	experimental_allowDisabledGestureTracking: RuntimeOption<
		ScreenOptionsSnapshot["experimental_allowDisabledGestureTracking"]
	>;
	gestureDirection: RuntimeOption<ScreenOptionsSnapshot["gestureDirection"]>;
	gestureSensitivity: RuntimeOption<
		ScreenOptionsSnapshot["gestureSensitivity"]
	>;
	gestureVelocityImpact: RuntimeOption<
		ScreenOptionsSnapshot["gestureVelocityImpact"]
	>;
	gestureSnapVelocityImpact: RuntimeOption<
		ScreenOptionsSnapshot["gestureSnapVelocityImpact"]
	>;
	gestureReleaseVelocityScale: RuntimeOption<
		ScreenOptionsSnapshot["gestureReleaseVelocityScale"]
	>;
	gestureResponseDistance: RuntimeOption<
		ScreenOptionsSnapshot["gestureResponseDistance"]
	>;
	gestureDrivesProgress: RuntimeOption<
		ScreenOptionsSnapshot["gestureDrivesProgress"]
	>;
	gestureActivationArea: RuntimeOption<
		ScreenOptionsSnapshot["gestureActivationArea"]
	>;
	gestureSnapLocked: RuntimeOption<ScreenOptionsSnapshot["gestureSnapLocked"]>;
	sheetScrollGestureBehavior: RuntimeOption<
		ScreenOptionsSnapshot["sheetScrollGestureBehavior"]
	>;
	backdropBehavior: RuntimeOption<ScreenOptionsSnapshot["backdropBehavior"]>;
	baseOptions: RuntimeOption<ScreenOptionsSnapshot>;
};

export interface ScreenOptionsProviderProps {
	children: ReactNode;
}
