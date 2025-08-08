import type { ScaledSize } from "react-native";
import type { MeasuredDimensions } from "react-native-reanimated";
import type {
	ContentTransformGeometry,
	RelativeGeometry,
} from "./_types/geometry";

/**
 * Relative geometry between start/end bounds.
 */
export function computeRelativeGeometry({
	start,
	end,
	entering,
}: {
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	entering: boolean;
}): RelativeGeometry {
	"worklet";
	const startCenterX = start.pageX + start.width / 2;
	const startCenterY = start.pageY + start.height / 2;
	const endCenterX = end.pageX + end.width / 2;
	const endCenterY = end.pageY + end.height / 2;

	const dx = startCenterX - endCenterX;
	const dy = startCenterY - endCenterY;

	const scaleX = start.width / end.width;
	const scaleY = start.height / end.height;

	const ranges: readonly [number, number] = entering ? [0, 1] : [1, 2];

	return { dx, dy, scaleX, scaleY, ranges, entering };
}

/**
 * Computes the transform to apply to the entire destination screen so that
 * its bound (end) matches the source bound (start) at progress start.
 */
export type ScaleMode = "axis" | "aspectFill" | "aspectFit";

export function computeContentTransformGeometry({
	start,
	end,
	entering,
	dimensions,
}: {
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	entering: boolean;
	dimensions: ScaledSize;
}): ContentTransformGeometry {
	"worklet";

	const parent = {
		x: 0,
		y: 0,
		width: dimensions.width,
		height: dimensions.height,
	};

	const startCenterX = start.pageX + start.width / 2;
	const startCenterY = start.pageY + start.height / 2;

	const childCenterX = end.pageX + end.width / 2;
	const childCenterY = end.pageY + end.height / 2;

	const parentCenterX = parent.x + parent.width / 2;
	const parentCenterY = parent.y + parent.height / 2;

	const safe = (v: number) => (v === 0 ? 1e-6 : v);

	const sx = safe(start.width) / safe(end.width);
	const sy = safe(start.height) / safe(end.height);
	const s = Math.max(sx, sy);

	const offsetX = startCenterX - parentCenterX;
	const offsetY = startCenterY - parentCenterY;

	const centerOffsetX = (parentCenterX - childCenterX) * s;
	const centerOffsetY = (parentCenterY - childCenterY) * s;

	const tx = offsetX + centerOffsetX;
	const ty = offsetY + centerOffsetY;

	const ranges: readonly [number, number] = entering ? [0, 1] : [1, 2];

	return {
		tx,
		ty,
		s,
		ranges,
		entering,
	};
}
