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
	gestureProgressMode: RequiredScreenOption<"gestureProgressMode">;
	gestureDrivesProgress: RequiredScreenOption<"gestureDrivesProgress">;
	gestureActivationArea: RequiredScreenOption<"gestureActivationArea">;
	gestureSnapLocked: RequiredScreenOption<"gestureSnapLocked">;
	sheetScrollGestureBehavior: RequiredScreenOption<"sheetScrollGestureBehavior">;
	backdropBehavior: OptionalScreenOption<"backdropBehavior">;
};

export type ScreenOptionsState = ScreenOptionsSnapshot & {
	baseOptions: ScreenOptionsSnapshot;
};

export type ScreenOptionsContextValue = RuntimeOption<ScreenOptionsState>;

export interface ScreenOptionsProviderProps {
	children: ReactNode;
}
