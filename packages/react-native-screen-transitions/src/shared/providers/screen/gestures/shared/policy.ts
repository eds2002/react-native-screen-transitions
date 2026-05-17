import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_PROGRESS_MODE,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SENSITIVITY,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
	DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
} from "../../../../constants";
import type {
	GestureActivationArea,
	GestureDirection,
	GestureProgressMode,
} from "../../../../types/gesture.types";
import type {
	ScreenTransitionConfig,
	SheetScrollGestureBehavior,
	SnapPoint,
} from "../../../../types/screen.types";
import { resolveGestureProgressMode } from "../../../../utils/gesture-progress-mode";
import { computeClaimedDirections } from "../ownership/compute-claimed-directions";
import { resolveOwnership } from "../ownership/resolve-ownership";
import type {
	GestureContextType,
	PanGesturePolicy,
	PinchGesturePolicy,
	ScreenGestureConfig,
	ScreenGestureParticipation,
} from "../types";
import {
	getPanActivationDirections,
	getPanGestureDirections,
	getPanSnapAxisDirections,
	getPinchGestureDirections,
	getSnapPinchDirectionConfig,
} from "./directions";
import { validateSnapPoints } from "./snap-points";

export type GesturePolicyOptions = {
	experimental_allowDisabledGestureTracking?: boolean;
	expandViaScrollView?: boolean;
	gestureActivationArea?: GestureActivationArea;
	gestureDirection?: GestureDirection | GestureDirection[];
	gestureDrivesProgress?: boolean;
	gestureEnabled?: boolean;
	gestureProgressMode?: GestureProgressMode;
	gestureReleaseVelocityScale?: number;
	gestureResponseDistance?: number;
	gestureSensitivity?: number;
	gestureSnapLocked?: boolean;
	gestureSnapVelocityImpact?: number;
	gestureVelocityImpact?: number;
	sheetScrollGestureBehavior?: SheetScrollGestureBehavior;
	snapPoints?: SnapPoint[];
	transitionSpec?: ScreenTransitionConfig["transitionSpec"];
};

const resolveGestureDirection = (options: GesturePolicyOptions) => {
	"worklet";
	return options.gestureDirection ?? DEFAULT_GESTURE_DIRECTION;
};

function resolveGestureProgressModePolicy(options: GesturePolicyOptions) {
	"worklet";
	return resolveGestureProgressMode({
		gestureProgressMode: options.gestureProgressMode,
		gestureDrivesProgress: options.gestureDrivesProgress,
		fallback: DEFAULT_GESTURE_PROGRESS_MODE,
	});
}

const resolveCommonGesturePolicy = (options: GesturePolicyOptions) => {
	"worklet";
	return {
		gestureProgressMode: resolveGestureProgressModePolicy(options),
		gestureSensitivity:
			options.gestureSensitivity ?? DEFAULT_GESTURE_SENSITIVITY,
		gestureSnapVelocityImpact:
			options.gestureSnapVelocityImpact ?? DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
		gestureSnapLocked: options.gestureSnapLocked ?? DEFAULT_GESTURE_SNAP_LOCKED,
		gestureReleaseVelocityScale:
			options.gestureReleaseVelocityScale ??
			DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
		transitionSpec: options.transitionSpec,
	};
};

function resolvePolicySheetScrollGestureBehavior(
	options: GesturePolicyOptions,
): SheetScrollGestureBehavior {
	"worklet";
	const explicitBehavior = options.sheetScrollGestureBehavior;
	if (explicitBehavior) {
		return explicitBehavior;
	}

	const legacyBehavior = options.expandViaScrollView;
	if (legacyBehavior !== undefined) {
		return legacyBehavior ? "expand-and-collapse" : "collapse-only";
	}

	return DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR;
}

const resolvePinchDirections = (
	gestureDirection: NonNullable<ScreenTransitionConfig["gestureDirection"]>,
	hasSnapPoints: boolean,
) => {
	"worklet";
	const pinchDirections = getPinchGestureDirections(gestureDirection);
	const snapDirections = hasSnapPoints
		? getSnapPinchDirectionConfig(gestureDirection)
		: null;

	if (snapDirections) {
		return {
			snapDirections,
			pinchInEnabled: true,
			pinchOutEnabled: true,
		};
	}

	return {
		snapDirections,
		pinchInEnabled: pinchDirections.includes("pinch-in"),
		pinchOutEnabled: pinchDirections.includes("pinch-out"),
	};
};

const resolveGestureCanDismiss = ({
	isFirstKey,
	gestureEnabled,
}: {
	isFirstKey: boolean;
	gestureEnabled?: boolean;
}) => {
	"worklet";
	return Boolean(isFirstKey ? false : gestureEnabled);
};

export const resolveGestureCanTrack = ({
	isFirstKey,
	canDismiss,
	hasSnapPoints,
	allowDisabledGestureTracking,
}: {
	isFirstKey: boolean;
	canDismiss: boolean;
	hasSnapPoints: boolean;
	allowDisabledGestureTracking?: boolean;
}) => {
	"worklet";
	if (isFirstKey) {
		return false;
	}

	if (canDismiss) {
		return true;
	}

	if (hasSnapPoints) {
		return true;
	}

	return allowDisabledGestureTracking === true;
};

export const resolvePanPolicy = (
	options: GesturePolicyOptions,
	hasSnapPoints: boolean,
): PanGesturePolicy => {
	"worklet";
	const gestureDirection = resolveGestureDirection(options);
	const hasPanDirection = getPanGestureDirections(gestureDirection).length > 0;

	return {
		enabled: hasPanDirection,
		gestureDirection,
		panActivationDirections: getPanActivationDirections({
			gestureDirection,
			hasSnapPoints,
		}),
		snapAxisDirections: getPanSnapAxisDirections(gestureDirection),
		...resolveCommonGesturePolicy(options),
		gestureVelocityImpact:
			options.gestureVelocityImpact ?? DEFAULT_GESTURE_VELOCITY_IMPACT,
		gestureActivationArea:
			options.gestureActivationArea ?? DEFAULT_GESTURE_ACTIVATION_AREA,
		sheetScrollGestureBehavior:
			resolvePolicySheetScrollGestureBehavior(options),
		gestureResponseDistance: options.gestureResponseDistance,
	};
};

export const resolvePinchPolicy = (
	options: GesturePolicyOptions,
	hasSnapPoints: boolean,
): PinchGesturePolicy => {
	"worklet";
	const gestureDirection = resolveGestureDirection(options);
	const pinchDirections = resolvePinchDirections(
		gestureDirection,
		hasSnapPoints,
	);

	return {
		enabled: pinchDirections.pinchInEnabled || pinchDirections.pinchOutEnabled,
		gestureDirection,
		...pinchDirections,
		...resolveCommonGesturePolicy(options),
	};
};

const resolveGestureParticipation = ({
	options,
	isFirstKey,
	gestureContext,
}: {
	options: GesturePolicyOptions;
	isFirstKey: boolean;
	gestureContext: GestureContextType | null;
}): ScreenGestureParticipation => {
	const canDismiss = resolveGestureCanDismiss({
		isFirstKey,
		gestureEnabled: options.gestureEnabled,
	});
	const effectiveSnapPoints = validateSnapPoints({
		snapPoints: options.snapPoints,
		canDismiss,
	});
	const canTrackGesture = resolveGestureCanTrack({
		isFirstKey,
		canDismiss,
		hasSnapPoints: effectiveSnapPoints.hasSnapPoints,
		allowDisabledGestureTracking:
			options.experimental_allowDisabledGestureTracking,
	});
	const claimedDirections = computeClaimedDirections(
		canTrackGesture,
		options.gestureDirection,
		effectiveSnapPoints.hasSnapPoints,
	);

	return {
		isFirstKey,
		canDismiss,
		canTrackGesture,
		effectiveSnapPoints,
		claimedDirections,
		ownershipStatus: resolveOwnership(claimedDirections, gestureContext),
	};
};

export const resolveScreenGestureConfig = ({
	options,
	isFirstKey,
	gestureContext,
}: {
	options: ScreenTransitionConfig;
	isFirstKey: boolean;
	gestureContext: GestureContextType | null;
}): ScreenGestureConfig => {
	const participation = resolveGestureParticipation({
		options,
		isFirstKey,
		gestureContext,
	});
	const hasSnapPoints = participation.effectiveSnapPoints.hasSnapPoints;

	return {
		participation,
		pan: resolvePanPolicy(options, hasSnapPoints),
		pinch: resolvePinchPolicy(options, hasSnapPoints),
	};
};

function resolveRuntimeCanDismiss(
	participation: Pick<ScreenGestureParticipation, "isFirstKey" | "canDismiss">,
	options: GesturePolicyOptions,
) {
	"worklet";
	if (participation.isFirstKey) {
		return false;
	}

	const gestureEnabled = options.gestureEnabled;
	if (gestureEnabled === false) {
		return false;
	}

	if (gestureEnabled === true) {
		return true;
	}

	return participation.canDismiss;
}

function resolveRuntimeCanTrackGesture(
	participation: Pick<
		ScreenGestureParticipation,
		"isFirstKey" | "canTrackGesture" | "effectiveSnapPoints"
	>,
	options: GesturePolicyOptions,
) {
	"worklet";
	if (participation.isFirstKey) {
		return false;
	}

	if (options.experimental_allowDisabledGestureTracking === true) {
		return true;
	}

	const gestureEnabled = options.gestureEnabled;
	if (gestureEnabled === true) {
		return true;
	}

	if (gestureEnabled === false) {
		return participation.effectiveSnapPoints.hasSnapPoints;
	}

	return participation.canTrackGesture;
}

export const resolveRuntimeGestureParticipation = ({
	participation,
	options,
}: {
	participation: ScreenGestureParticipation;
	options: GesturePolicyOptions;
}): ScreenGestureParticipation => {
	"worklet";
	const canDismiss = resolveRuntimeCanDismiss(participation, options);
	const canTrackGesture = resolveRuntimeCanTrackGesture(participation, options);

	return {
		...participation,
		canDismiss,
		canTrackGesture,
	};
};
