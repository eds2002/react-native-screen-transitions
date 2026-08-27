import type { MeasuredDimensions } from "react-native-reanimated";
import { EPSILON } from "../../../../constants";
import type { Layout } from "../../../../types/screen.types";
import { resolveTrackedSourceElementTransform } from "../reveal/math";

export function resolveZoomBackdropOpacity({
	transitionProgress,
	dismissalDrag,
	fadeEnd,
	maxOpacity,
}: {
	transitionProgress: number;
	dismissalDrag: number;
	fadeEnd: number;
	maxOpacity: number;
}) {
	"worklet";

	const clampedProgress = Math.min(1, Math.max(0, transitionProgress));
	const clampedDrag = Math.min(1, Math.max(0, dismissalDrag));
	const safeFadeEnd = Math.max(EPSILON, fadeEnd);
	const transitionOpacity = Math.min(1, clampedProgress / safeFadeEnd);
	const clampedMaxOpacity = Math.min(1, Math.max(0, maxOpacity));

	return clampedMaxOpacity * transitionOpacity * (1 - clampedDrag);
}

export function resolveZoomPinchFocalOffset({
	gestureScale,
	pinchOriginX,
	pinchOriginY,
	progress,
	rotation,
	screenLayout,
}: {
	gestureScale: number;
	pinchOriginX: number;
	pinchOriginY: number;
	progress: number;
	rotation: number;
	screenLayout: Layout;
}) {
	"worklet";

	if (Math.abs(gestureScale - 1) <= EPSILON && Math.abs(rotation) <= EPSILON) {
		return { x: 0, y: 0 };
	}

	const offsetX = pinchOriginX - screenLayout.width / 2;
	const offsetY = pinchOriginY - screenLayout.height / 2;
	const cosine = Math.cos(rotation);
	const sine = Math.sin(rotation);
	const transformedOffsetX = gestureScale * (offsetX * cosine - offsetY * sine);
	const transformedOffsetY = gestureScale * (offsetX * sine + offsetY * cosine);
	const clampedProgress = Math.min(1, Math.max(0, progress));

	return {
		x: (offsetX - transformedOffsetX) * clampedProgress,
		y: (offsetY - transformedOffsetY) * clampedProgress,
	};
}

export function resolveZoomTrackedSourceTransform({
	sourceBounds,
	destinationBounds,
	screenLayout,
	contentBaseTransform,
	collapsedContentScale,
	dragX,
	dragY,
	gestureScale,
	parentScale,
	rotation = 0,
}: {
	sourceBounds: MeasuredDimensions;
	destinationBounds: MeasuredDimensions;
	screenLayout: Layout;
	contentBaseTransform: {
		translateX: number;
		translateY: number;
		scale: number;
	};
	collapsedContentScale: number;
	dragX: number;
	dragY: number;
	gestureScale: number;
	parentScale: number;
	rotation?: number;
}) {
	"worklet";

	const contentScale = contentBaseTransform.scale * gestureScale;
	const safeCollapsedContentScale = Math.max(
		Math.abs(collapsedContentScale),
		EPSILON,
	);
	const safeParentScale = Math.max(Math.abs(parentScale), EPSILON);
	const uniformSourceScale =
		contentScale / (safeCollapsedContentScale * safeParentScale);
	const trackedTransform = {
		...resolveTrackedSourceElementTransform({
			sourceBounds,
			destinationBounds,
			contentTranslateX: contentBaseTransform.translateX + dragX,
			contentTranslateY: contentBaseTransform.translateY + dragY,
			contentScale,
			parentScale,
			screenWidth: screenLayout.width,
			screenHeight: screenLayout.height,
		}),
		scaleX: uniformSourceScale,
		scaleY: uniformSourceScale,
	};

	if (Math.abs(rotation) <= EPSILON) {
		return trackedTransform;
	}

	const screenCenterX = screenLayout.width / 2;
	const screenCenterY = screenLayout.height / 2;
	const destinationCenterX =
		destinationBounds.pageX + destinationBounds.width / 2;
	const destinationCenterY =
		destinationBounds.pageY + destinationBounds.height / 2;
	const scaledOffsetX = (destinationCenterX - screenCenterX) * contentScale;
	const scaledOffsetY = (destinationCenterY - screenCenterY) * contentScale;
	const cosine = Math.cos(rotation);
	const sine = Math.sin(rotation);
	const rotatedOffsetX = scaledOffsetX * cosine - scaledOffsetY * sine;
	const rotatedOffsetY = scaledOffsetX * sine + scaledOffsetY * cosine;

	return {
		...trackedTransform,
		translateX:
			trackedTransform.translateX +
			(rotatedOffsetX - scaledOffsetX) / safeParentScale,
		translateY:
			trackedTransform.translateY +
			(rotatedOffsetY - scaledOffsetY) / safeParentScale,
	};
}
