import type { GestureProgressMode } from "../types/gesture.types";

type GestureProgressModeOptions = {
	gestureProgressMode?: GestureProgressMode;
	gestureDrivesProgress?: boolean;
};

type ResolveGestureProgressModeOptions = GestureProgressModeOptions & {
	fallback?: GestureProgressMode;
};

export const isGestureProgressMode = (
	value: unknown,
): value is GestureProgressMode => {
	"worklet";
	return value === "progress-driven" || value === "freeform";
};

export const resolveGestureProgressMode = (
	options: ResolveGestureProgressModeOptions | boolean | undefined,
): GestureProgressMode => {
	"worklet";
	if (typeof options === "boolean" || options === undefined) {
		return options === false ? "freeform" : "progress-driven";
	}

	if (isGestureProgressMode(options.gestureProgressMode)) {
		return options.gestureProgressMode;
	}

	if (typeof options.gestureDrivesProgress === "boolean") {
		return options.gestureDrivesProgress ? "progress-driven" : "freeform";
	}

	return options.fallback ?? "progress-driven";
};

export const resolveGestureProgressModeFromOptions = (
	primary: GestureProgressModeOptions | undefined,
	fallback: GestureProgressModeOptions | undefined,
	defaultMode: GestureProgressMode = "progress-driven",
): GestureProgressMode => {
	"worklet";
	if (
		primary &&
		(isGestureProgressMode(primary.gestureProgressMode) ||
			typeof primary.gestureDrivesProgress === "boolean")
	) {
		return resolveGestureProgressMode({
			gestureProgressMode: primary.gestureProgressMode,
			gestureDrivesProgress: primary.gestureDrivesProgress,
		});
	}

	return resolveGestureProgressMode({
		gestureProgressMode: fallback?.gestureProgressMode,
		gestureDrivesProgress: fallback?.gestureDrivesProgress,
		fallback: defaultMode,
	});
};

export const gestureProgressModeDrivesProgress = (
	mode: GestureProgressMode,
) => {
	"worklet";
	return mode === "progress-driven";
};
