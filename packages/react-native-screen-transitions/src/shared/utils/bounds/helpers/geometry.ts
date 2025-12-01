import type { MeasuredDimensions } from "react-native-reanimated";
import type { Layout } from "../../../types/core";
import type { BoundsAnchor, BoundsScaleMode } from "../types/builder";
import type {
	ContentTransformGeometry,
	RelativeGeometry,
} from "../types/geometry";

/**
 * Get the anchor point coordinates for a given bound
 */
function getAnchorPoint(
	bounds: MeasuredDimensions,
	anchor: BoundsAnchor = "center",
): { x: number; y: number } {
	"worklet";

	const { pageX, pageY, width, height } = bounds;

	switch (anchor) {
		case "topLeading":
			return { x: pageX, y: pageY };
		case "top":
			return { x: pageX + width / 2, y: pageY };
		case "topTrailing":
			return { x: pageX + width, y: pageY };
		case "leading":
			return { x: pageX, y: pageY + height / 2 };
		case "center":
			return { x: pageX + width / 2, y: pageY + height / 2 };
		case "trailing":
			return { x: pageX + width, y: pageY + height / 2 };
		case "bottomLeading":
			return { x: pageX, y: pageY + height };
		case "bottom":
			return { x: pageX + width / 2, y: pageY + height };
		case "bottomTrailing":
			return { x: pageX + width, y: pageY + height };
		default:
			// Default to center
			return { x: pageX + width / 2, y: pageY + height / 2 };
	}
}

/**
 * Relative geometry between start/end bounds.
 */
export function computeRelativeGeometry({
	start,
	end,
	entering,
	anchor = "center",
	scaleMode = "match",
}: {
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	entering: boolean;
	anchor?: BoundsAnchor;
	scaleMode?: BoundsScaleMode;
}): RelativeGeometry {
	"worklet";

	let scaleX: number;
	let scaleY: number;

	if (scaleMode === "none") {
		scaleX = 1;
		scaleY = 1;
	} else if (scaleMode === "uniform") {
		const sx = start.width / end.width;
		const sy = start.height / end.height;

		const startAspect = start.width / start.height;
		const endAspect = end.width / end.height;
		const aspectDifference = Math.abs(startAspect - endAspect);

		const scale = aspectDifference < 0.1 ? Math.max(sx, sy) : Math.min(sx, sy);
		scaleX = scale;
		scaleY = scale;
	} else {
		scaleX = start.width / end.width;
		scaleY = start.height / end.height;
	}

	const startAnchor = getAnchorPoint(start, anchor);
	const endAnchor = getAnchorPoint(end, anchor);

	const endCenter = getAnchorPoint(end, "center");
	const anchorOffsetX = endAnchor.x - endCenter.x;
	const anchorOffsetY = endAnchor.y - endCenter.y;

	const dx = startAnchor.x - endCenter.x - anchorOffsetX * scaleX;
	const dy = startAnchor.y - endCenter.y - anchorOffsetY * scaleY;

	return { dx, dy, scaleX, scaleY, entering };
}
/**
 * Computes the transform to apply to the entire destination screen so that
 * its bound (end) matches the source bound (start) at progress start.
 */
export function computeContentTransformGeometry({
	start,
	end,
	entering,
	dimensions,
	anchor = "center",
	scaleMode = "uniform",
}: {
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	entering: boolean;
	dimensions: Layout;
	anchor?: BoundsAnchor;
	scaleMode?: BoundsScaleMode;
}): ContentTransformGeometry {
	"worklet";

	// Calculate scale based on how much we need to scale the screen
	// so that the end element matches the start element's size
	let s: number;

	if (scaleMode === "none") {
		s = 1;
	} else if (scaleMode === "uniform") {
		const sx = start.width / end.width;
		const sy = start.height / end.height;

		const startAspect = start.width / start.height;
		const endAspect = end.width / end.height;
		const aspectDifference = Math.abs(startAspect - endAspect);

		s = aspectDifference < 0.1 ? Math.max(sx, sy) : Math.min(sx, sy);
	} else {
		// For "match" mode on full screen, we need uniform scale
		const sx = start.width / end.width;
		const sy = start.height / end.height;
		s = (sx + sy) / 2;
	}

	// Get anchor points
	const startAnchor = getAnchorPoint(start, anchor);
	const endAnchor = getAnchorPoint(end, anchor);

	// Screen center (scaling origin)
	const screenCenterX = dimensions.width / 2;
	const screenCenterY = dimensions.height / 2;

	// How far the end anchor is from screen center
	const endOffsetFromScreenCenterX = endAnchor.x - screenCenterX;
	const endOffsetFromScreenCenterY = endAnchor.y - screenCenterY;

	// After scaling the screen from its center, the end anchor moves to:
	const scaledEndAnchorX = screenCenterX + endOffsetFromScreenCenterX * s;
	const scaledEndAnchorY = screenCenterY + endOffsetFromScreenCenterY * s;

	// Translation to align scaled end anchor with start anchor
	const tx = startAnchor.x - scaledEndAnchorX;
	const ty = startAnchor.y - scaledEndAnchorY;

	return {
		tx,
		ty,
		s,
		entering,
	};
}
