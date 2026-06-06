import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "../../../types";

export type RuntimeOption<T> = SharedValue<T>;
export type RequiredScreenOption<K extends keyof ScreenTransitionConfig> =
	NonNullable<ScreenTransitionConfig[K]>;
export type OptionalScreenOption<K extends keyof ScreenTransitionConfig> =
	ScreenTransitionConfig[K];

export type ScreenOptionsSnapshot = {
	navigationMaskEnabled: OptionalScreenOption<"navigationMaskEnabled">;
	gestureEnabled: OptionalScreenOption<"gestureEnabled">;
	gestureTracking: RequiredScreenOption<"gestureTracking">;
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
	transitionSpec: OptionalScreenOption<"transitionSpec">;
};

export type ScreenOptionsState = ScreenOptionsSnapshot & {
	baseOptions: ScreenOptionsSnapshot;
};

export type ScreenOptionsContextValue = RuntimeOption<ScreenOptionsState>;

export interface ScreenOptionsProviderProps {
	children: ReactNode;
}
