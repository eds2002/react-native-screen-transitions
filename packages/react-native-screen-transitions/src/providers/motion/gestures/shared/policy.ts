import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SENSITIVITY,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_TRACKING,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
	DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
	DEFAULT_SHEET_SNAP_BEHAVIOR,
} from "../../../../constants";
import type {
	GestureDirectionActivationArea,
	GestureDirectionEntry,
	GestureDirectionOption,
	ResolvedGestureActivationArea,
} from "../../../../types/gesture.types";
import type {
	GestureTracking,
	ScreenTransitionConfig,
	SheetScrollGestureBehavior,
	SheetSnapBehavior,
	SnapPoint,
} from "../../../../types/screen.types";
import { computeClaimedDirections } from "../ownership/compute-claimed-directions";
import type {
	PanGesturePolicy,
	PinchGesturePolicy,
	ScreenGestureConfig,
	ScreenGestureParticipation,
} from "../types";
import {
	getGestureDirectionEntries,
	getGestureDirectionEntryGesture,
	getPanActivationDirections,
	getPanGestureDirections,
	getPanSnapAxisDirections,
	getPinchGestureDirections,
	getSnapPinchDirectionConfig,
} from "./directions";
import { validateSnapPoints } from "./snap-points";

export type GesturePolicyOptions = {
	gestureDirection?: GestureDirectionOption;
	gestureEnabled?: boolean;
	gestureTracking?: GestureTracking;
	gestureReleaseVelocityScale?: number;
	gestureSensitivity?: number;
	gestureSnapLocked?: boolean;
	gestureSnapVelocityImpact?: number;
	gestureVelocityImpact?: number;
	sheetSnapBehavior?: SheetSnapBehavior;
	sheetScrollGestureBehavior?: SheetScrollGestureBehavior;
	snapPoints?: SnapPoint[];
	transitionSpec?: ScreenTransitionConfig["transitionSpec"];
};

const resolveGestureDirection = (options: GesturePolicyOptions) => {
	"worklet";
	return options.gestureDirection ?? DEFAULT_GESTURE_DIRECTION;
};

const isStructuredGestureDirection = (entry: GestureDirectionEntry) => {
	"worklet";
	return typeof entry !== "string";
};

const getGestureDirectionActivationArea = (
	entry: GestureDirectionEntry,
): GestureDirectionActivationArea => {
	"worklet";
	return isStructuredGestureDirection(entry)
		? (entry.area ?? DEFAULT_GESTURE_ACTIVATION_AREA)
		: DEFAULT_GESTURE_ACTIVATION_AREA;
};

const resolveConfiguredGestureActivationArea = (
	gestureDirection: GestureDirectionOption,
	hasSnapPoints: boolean,
): ResolvedGestureActivationArea | undefined => {
	"worklet";
	const entries = getGestureDirectionEntries(gestureDirection);
	let hasStructuredEntry = false;

	for (const entry of entries) {
		if (isStructuredGestureDirection(entry)) {
			hasStructuredEntry = true;
			break;
		}
	}

	if (!hasStructuredEntry) {
		return undefined;
	}

	const sides = {
		left: DEFAULT_GESTURE_ACTIVATION_AREA as GestureDirectionActivationArea,
		right: DEFAULT_GESTURE_ACTIVATION_AREA as GestureDirectionActivationArea,
		top: DEFAULT_GESTURE_ACTIVATION_AREA as GestureDirectionActivationArea,
		bottom: DEFAULT_GESTURE_ACTIVATION_AREA as GestureDirectionActivationArea,
	};

	for (const entry of entries) {
		const gesture = getGestureDirectionEntryGesture(entry);
		const area = getGestureDirectionActivationArea(entry);

		switch (gesture) {
			case "horizontal":
				sides.left = area;
				if (hasSnapPoints) sides.right = area;
				break;
			case "horizontal-inverted":
				sides.right = area;
				if (hasSnapPoints) sides.left = area;
				break;
			case "vertical":
				sides.top = area;
				if (hasSnapPoints) sides.bottom = area;
				break;
			case "vertical-inverted":
				sides.bottom = area;
				if (hasSnapPoints) sides.top = area;
				break;
			case "bidirectional":
				sides.left = area;
				sides.right = area;
				sides.top = area;
				sides.bottom = area;
				break;
		}
	}

	return sides;
};

const resolveGestureActivationArea = (
	gestureDirection: GestureDirectionOption,
	hasSnapPoints: boolean,
): ResolvedGestureActivationArea => {
	"worklet";
	return (
		resolveConfiguredGestureActivationArea(gestureDirection, hasSnapPoints) ??
		DEFAULT_GESTURE_ACTIVATION_AREA
	);
};

const resolveCommonGesturePolicy = (options: GesturePolicyOptions) => {
	"worklet";
	return {
		gestureSensitivity:
			options.gestureSensitivity ?? DEFAULT_GESTURE_SENSITIVITY,
		gestureSnapVelocityImpact:
			options.gestureSnapVelocityImpact ?? DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
		gestureSnapLocked: options.gestureSnapLocked ?? DEFAULT_GESTURE_SNAP_LOCKED,
		sheetSnapBehavior: options.sheetSnapBehavior ?? DEFAULT_SHEET_SNAP_BEHAVIOR,
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
	return (
		options.sheetScrollGestureBehavior ?? DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR
	);
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
	gestureTracking = DEFAULT_GESTURE_TRACKING,
}: {
	isFirstKey: boolean;
	canDismiss: boolean;
	hasSnapPoints: boolean;
	gestureTracking?: GestureTracking;
}) => {
	"worklet";
	if (isFirstKey) {
		return false;
	}

	if (gestureTracking === "never") {
		return false;
	}

	if (gestureTracking === "always") {
		return true;
	}

	if (canDismiss) {
		return true;
	}

	if (hasSnapPoints) {
		return true;
	}

	return false;
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
		gestureActivationArea: resolveGestureActivationArea(
			gestureDirection,
			hasSnapPoints,
		),
		sheetScrollGestureBehavior:
			resolvePolicySheetScrollGestureBehavior(options),
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
}: {
	options: GesturePolicyOptions;
	isFirstKey: boolean;
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
		gestureTracking: options.gestureTracking,
	});
	const claimedDirections = computeClaimedDirections(
		canTrackGesture,
		resolveGestureDirection(options),
		effectiveSnapPoints.hasSnapPoints,
	);

	return {
		isFirstKey,
		canDismiss,
		canTrackGesture,
		effectiveSnapPoints,
		claimedDirections,
	};
};

export const resolveScreenGestureConfig = ({
	options,
	isFirstKey,
}: {
	options: ScreenTransitionConfig;
	isFirstKey: boolean;
}): ScreenGestureConfig => {
	const participation = resolveGestureParticipation({
		options,
		isFirstKey,
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

	if (options.gestureTracking === "never") {
		return false;
	}

	if (options.gestureTracking === "always") {
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
