import type { MeasuredDimensions } from "react-native-reanimated";
import { EPSILON } from "../../../../constants";
import type { Layout } from "../../../../types/screen.types";
import { computeContentTransformGeometry } from "../../helpers/geometry";
import {
	DISMISS_SCALE_ORBIT_DEPTH,
	DRAG_DIRECTIONAL_SCALE_EXPONENT,
	DRAG_DIRECTIONAL_SCALE_MAX,
	DRAG_DIRECTIONAL_SCALE_MIN,
} from "./config";

function clampUnit(value: number) {
	"worklet";
	return Math.min(1, Math.max(0, value));
}

export function mixUnit(from: number, to: number, progress: number) {
	"worklet";
	return from + (to - from) * clampUnit(progress);
}

export function interpolateClamped(
	value: number,
	inputStart: number,
	inputEnd: number,
	outputStart: number,
	outputEnd: number,
) {
	"worklet";
	return mixUnit(
		outputStart,
		outputEnd,
		(value - inputStart) / (inputEnd - inputStart),
	);
}

export function resolveSafeScale(scale: number) {
	"worklet";
	return Math.abs(scale) > EPSILON ? scale : 1;
}

export const resolveUnitDragTranslation = (
	translation: number,
	dimension: number,
) => {
	"worklet";

	const baseDistance = Math.max(1, dimension);

	if (translation < -baseDistance) {
		return -baseDistance;
	}

	if (translation > baseDistance) {
		return baseDistance;
	}

	return translation;
};

export function resolveRevealDirectionalDragScale(
	normalized: number,
	inverted: boolean,
) {
	"worklet";

	const dismissalRelative = inverted ? -normalized : normalized;

	if (dismissalRelative >= 0) {
		const rawScale = mixUnit(1, DRAG_DIRECTIONAL_SCALE_MIN, dismissalRelative);
		return rawScale ** DRAG_DIRECTIONAL_SCALE_EXPONENT;
	}

	const oppositeDrag = Math.min(1, Math.abs(dismissalRelative));
	return mixUnit(1, DRAG_DIRECTIONAL_SCALE_MAX, oppositeDrag);
}

export function resolveUniformScale({
	sourceWidth,
	sourceHeight,
	destinationWidth,
	destinationHeight,
}: {
	sourceWidth: number;
	sourceHeight: number;
	destinationWidth: number;
	destinationHeight: number;
}) {
	"worklet";

	const sx = sourceWidth / destinationWidth;
	const sy = sourceHeight / destinationHeight;

	const sourceAspect = sourceWidth / sourceHeight;
	const destinationAspect = destinationWidth / destinationHeight;
	const aspectDifference = Math.abs(sourceAspect - destinationAspect);

	return aspectDifference < 0.1 ? Math.max(sx, sy) : Math.min(sx, sy);
}

export function resolveRevealGestureHandoff(rawDrag: number) {
	"worklet";

	const clampedRawDrag = clampUnit(rawDrag);
	const gestureSensitivity = mixUnit(0.8, 0.1, clampedRawDrag);

	const releaseBoost = mixUnit(1, 1.1, clampedRawDrag);

	const releaseSensitivity = interpolateClamped(
		gestureSensitivity,
		0.28,
		0.9,
		0.7,
		1,
	);

	return {
		gestureSensitivity,
		gestureReleaseVelocityScale: releaseBoost * releaseSensitivity,
	};
}

export function resolveDismissScaleHandoff({
	progress,
	releaseScale,
	targetScale,
	velocity,
}: {
	progress: number;
	releaseScale: number;
	targetScale: number;
	velocity: number;
}) {
	"worklet";

	const closeProgress = 1 - progress;
	const scaleProgress = Math.sin((Math.PI / 2) * closeProgress);
	const baseScale = releaseScale + (targetScale - releaseScale) * scaleProgress;

	const orbitDepth = DISMISS_SCALE_ORBIT_DEPTH * velocity;
	const orbitScale = 1 - orbitDepth * Math.sin(Math.PI * closeProgress);

	return baseScale * orbitScale;
}

function getBoundsCenterX(bounds: MeasuredDimensions) {
	"worklet";
	return bounds.pageX + bounds.width / 2;
}

function getBoundsCenterY(bounds: MeasuredDimensions) {
	"worklet";
	return bounds.pageY + bounds.height / 2;
}

export function resolveRevealContentBaseTransform({
	progress,
	sourceBounds,
	destinationBounds,
	screenLayout,
}: {
	progress: number;
	sourceBounds: MeasuredDimensions;
	destinationBounds: MeasuredDimensions;
	screenLayout: Layout;
}) {
	"worklet";

	const geometry = computeContentTransformGeometry({
		start: sourceBounds,
		end: destinationBounds,
		entering: true,
		dimensions: screenLayout,
		scaleMode: "uniform",
	});

	return {
		translateX: mixUnit(geometry.tx, 0, progress),
		translateY: mixUnit(geometry.ty, 0, progress),
		scale: mixUnit(geometry.s, 1, progress),
	};
}

export function resolveTrackedSourceElementTransform({
	sourceBounds,
	destinationBounds,
	contentTranslateX,
	contentTranslateY,
	contentScale,
	parentScale,
	screenWidth,
	screenHeight,
}: {
	sourceBounds: MeasuredDimensions;
	destinationBounds: MeasuredDimensions;
	contentTranslateX: number;
	contentTranslateY: number;
	contentScale: number;
	parentScale: number;
	screenWidth: number;
	screenHeight: number;
}) {
	"worklet";

	const screenCenterX = screenWidth / 2;
	const screenCenterY = screenHeight / 2;
	const safeParentScale = Math.max(Math.abs(parentScale), EPSILON);
	const safeSourceWidth = Math.max(Math.abs(sourceBounds.width), EPSILON);
	const safeSourceHeight = Math.max(Math.abs(sourceBounds.height), EPSILON);

	const sourceCenterX = getBoundsCenterX(sourceBounds);
	const sourceCenterY = getBoundsCenterY(sourceBounds);
	const destinationCenterX = getBoundsCenterX(destinationBounds);
	const destinationCenterY = getBoundsCenterY(destinationBounds);

	const trackedCenterX =
		screenCenterX +
		(destinationCenterX - screenCenterX) * contentScale +
		contentTranslateX;
	const trackedCenterY =
		screenCenterY +
		(destinationCenterY - screenCenterY) * contentScale +
		contentTranslateY;

	return {
		translateX:
			(trackedCenterX - screenCenterX) / safeParentScale +
			screenCenterX -
			sourceCenterX,
		translateY:
			(trackedCenterY - screenCenterY) / safeParentScale +
			screenCenterY -
			sourceCenterY,
		scaleX:
			(destinationBounds.width * contentScale) /
			(safeSourceWidth * safeParentScale),
		scaleY:
			(destinationBounds.height * contentScale) /
			(safeSourceHeight * safeParentScale),
	};
}
