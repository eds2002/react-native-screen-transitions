import { EPSILON } from "../../../../constants";
import type {
	BoundsInterpolationProps,
	BoundsNavigationZoomDragOptions,
} from "../../../../types/bounds.types";
import type { Layout } from "../../../../types/screen.types";
import { ZOOM_DISMISS_VELOCITY_DEPTH } from "./config";

const ZOOM_DRAG_SCALE_EXPONENT = 2;
const ZOOM_DRAG_SCALE_FLOOR = 0.5;
const ZOOM_COUNTER_DRAG_SCALE_INTENSITY = 0.4;
const ZOOM_PRIMARY_DRAG_TRANSLATION_SCALE = 0.8;
const ZOOM_PRIMARY_DRAG_RESISTANCE = 2;
const ZOOM_HORIZONTAL_DRAG_DISTANCE_SCALE = 1.5;
const ZOOM_CROSS_AXIS_DRAG_TRANSLATION_SCALE = 0.35;
const ZOOM_CROSS_AXIS_DRAG_RESISTANCE = 0.05;
const ZOOM_PINCH_SCALE_RESPONSE = 1;
const ZOOM_PINCH_VELOCITY_DEPTH_MULTIPLIER = 2;

type ZoomGesture = BoundsInterpolationProps["active"]["gesture"];

export type ZoomDragState = {
	collapsesMask: boolean;
	dismissContentScale: number;
	dismissNorm: number;
	dismissProgress: number;
	dragX: number;
	dragY: number;
	gestureScale: number;
	isDismissing: boolean;
	isVerticalInverted: boolean;
	rotation: number;
};

export function resolveZoomDismissContentScale({
	transitionRemaining,
	releaseScale,
	targetScale,
	velocity,
	velocityDepth,
}: {
	transitionRemaining: number;
	releaseScale: number;
	targetScale: number;
	velocity: number;
	velocityDepth: number;
}) {
	"worklet";

	const closeProgress = 1 - transitionRemaining;
	const depth = velocityDepth * velocity;

	const scaleDelta = targetScale - releaseScale;
	const controlScale1 = releaseScale + scaleDelta / 3;
	const linearControlScale2 = releaseScale + (2 * scaleDelta) / 3;
	const controlScale2 = Math.max(EPSILON, linearControlScale2 * (1 - depth));
	const remaining = 1 - closeProgress;

	return (
		remaining * remaining * remaining * releaseScale +
		3 * remaining * remaining * closeProgress * controlScale1 +
		3 * remaining * closeProgress * closeProgress * controlScale2 +
		closeProgress * closeProgress * closeProgress * targetScale
	);
}

export function resolveZoomPrimaryDragTranslation({
	translation,
	dimension,
}: {
	translation: number;
	dimension: number;
}) {
	"worklet";

	const direction = translation < 0 ? -1 : 1;
	const translationDistance = Math.abs(translation);
	const baseDistance = Math.max(1, dimension);
	const normalizedTranslation = translationDistance / baseDistance;
	const effectiveResistance = ZOOM_PRIMARY_DRAG_RESISTANCE * 0.85;
	const resistedTranslation =
		(baseDistance *
			(1 - Math.exp(-effectiveResistance * normalizedTranslation))) /
		effectiveResistance;

	return (
		direction *
		Math.min(
			baseDistance,
			resistedTranslation * ZOOM_PRIMARY_DRAG_TRANSLATION_SCALE,
		)
	);
}

export function resolveZoomHorizontalDragTranslation({
	translation,
	dimension,
}: {
	translation: number;
	dimension: number;
}) {
	"worklet";

	return (
		resolveZoomPrimaryDragTranslation({ translation, dimension }) *
		ZOOM_HORIZONTAL_DRAG_DISTANCE_SCALE
	);
}

export function resolveZoomCrossAxisDragTranslation({
	translation,
	dimension,
}: {
	translation: number;
	dimension: number;
}) {
	"worklet";

	const direction = translation < 0 ? -1 : 1;
	const translationDistance = Math.abs(translation);
	const baseDistance = Math.max(1, dimension);
	const normalizedTranslation = translationDistance / baseDistance;
	const resistedTranslation =
		(baseDistance *
			(1 -
				Math.exp(-ZOOM_CROSS_AXIS_DRAG_RESISTANCE * normalizedTranslation))) /
		ZOOM_CROSS_AXIS_DRAG_RESISTANCE;

	return (
		direction *
		Math.min(
			baseDistance,
			resistedTranslation * ZOOM_CROSS_AXIS_DRAG_TRANSLATION_SCALE,
		)
	);
}

export function resolveZoomDragScale(normalized: number) {
	"worklet";

	const scaleInput =
		normalized < 0
			? normalized * ZOOM_COUNTER_DRAG_SCALE_INTENSITY
			: normalized;
	const progress = Math.min(1, scaleInput);
	const rawMinimumScale =
		ZOOM_DRAG_SCALE_FLOOR ** (1 / ZOOM_DRAG_SCALE_EXPONENT);
	const rawScale = 1 + (rawMinimumScale - 1) * progress;

	return rawScale ** ZOOM_DRAG_SCALE_EXPONENT;
}

export function resolveZoomPinchScale(scale: number) {
	"worklet";
	return 1 + (scale - 1) * ZOOM_PINCH_SCALE_RESPONSE;
}

export function resolveZoomDismissalNorm(
	normalized: number,
	isInverted: boolean,
) {
	"worklet";
	return isInverted ? -normalized : normalized;
}

export function resolveZoomDragState({
	gesture,
	activeTransitionProgress,
	screenLayout,
	collapsedContentScale,
	dragOptions,
}: {
	gesture: ZoomGesture;
	activeTransitionProgress: number;
	screenLayout: Layout;
	collapsedContentScale: number;
	dragOptions?: BoundsNavigationZoomDragOptions;
}): ZoomDragState {
	"worklet";

	const gestureHandoff = gesture.handoff;
	const isDismissing = gesture.dismissing === 1;
	const activeGesture = gestureHandoff.active;
	const isHorizontalInverted = activeGesture === "horizontal-inverted";
	const isHorizontal = activeGesture === "horizontal" || isHorizontalInverted;
	const isVerticalInverted = activeGesture === "vertical-inverted";
	const isVertical = activeGesture === "vertical" || isVerticalInverted;
	const isPinchIn = activeGesture === "pinch-in";
	const isInverted = isHorizontalInverted || isVerticalInverted;
	const translationResponse = Math.max(
		0,
		isHorizontal
			? (dragOptions?.translation?.horizontal ?? 1)
			: isVertical
				? (dragOptions?.translation?.vertical ?? 1)
				: 1,
	);
	const scaleResponse = Math.max(
		0,
		isHorizontal
			? (dragOptions?.scale?.horizontal ?? 1)
			: isVertical
				? (dragOptions?.scale?.vertical ?? 1)
				: 1,
	);
	const handoffPrimaryNorm = isPinchIn
		? -gestureHandoff.normScale
		: isHorizontal
			? gestureHandoff.normX
			: gestureHandoff.normY;
	const livePrimaryNorm = isPinchIn
		? -gesture.normScale
		: isHorizontal
			? gesture.normX
			: gesture.normY;
	const dismissNorm = Math.max(
		0,
		resolveZoomDismissalNorm(handoffPrimaryNorm, isInverted),
	);
	const nativeDragX = isPinchIn
		? gesture.x
		: isHorizontal
			? resolveZoomHorizontalDragTranslation({
					translation: gesture.x,
					dimension: screenLayout.width,
				})
			: isVertical
				? resolveZoomCrossAxisDragTranslation({
						translation: gesture.x,
						dimension: screenLayout.width,
					})
				: 0;
	const nativeDragY = isPinchIn
		? gesture.y
		: isHorizontal
			? resolveZoomCrossAxisDragTranslation({
					translation: gesture.y,
					dimension: screenLayout.height,
				})
			: resolveZoomPrimaryDragTranslation({
					translation: gesture.y,
					dimension: screenLayout.height,
				});
	const dragX = nativeDragX * translationResponse;
	const dragY = nativeDragY * translationResponse;
	const scaleNorm = resolveZoomDismissalNorm(
		isDismissing ? handoffPrimaryNorm : livePrimaryNorm,
		isInverted,
	);
	const nativeGestureScale = isPinchIn
		? resolveZoomPinchScale(isDismissing ? gestureHandoff.scale : gesture.scale)
		: resolveZoomDragScale(scaleNorm);
	const gestureScale = isPinchIn
		? nativeGestureScale
		: Math.max(EPSILON, 1 + (nativeGestureScale - 1) * scaleResponse);
	const rotation = isPinchIn
		? isDismissing
			? gestureHandoff.rotation * activeTransitionProgress
			: gesture.rotation
		: 0;

	let dismissContentScale = gestureScale;

	if (isDismissing) {
		dismissContentScale = resolveZoomDismissContentScale({
			transitionRemaining: activeTransitionProgress,
			releaseScale: gestureScale,
			targetScale: collapsedContentScale,
			velocity: gestureHandoff.velocity,
			velocityDepth:
				ZOOM_DISMISS_VELOCITY_DEPTH *
				(isPinchIn ? ZOOM_PINCH_VELOCITY_DEPTH_MULTIPLIER : 1),
		});
	}

	return {
		collapsesMask: isVertical,
		dismissContentScale,
		dismissNorm,
		dismissProgress: isDismissing ? 1 - activeTransitionProgress : 0,
		dragX,
		dragY,
		gestureScale,
		isDismissing,
		isVerticalInverted,
		rotation,
	};
}
