/**
 * @deprecated
 * This file is no longer used in the V3 "Tag-First" architecture.
 * Bounds are now resolved directly from the BoundStore in utils/bounds/index.ts.
 */
import type { BoundEntry } from "../../../types/bounds";
import type { GetBoundsParams } from "../_types/get-bounds";

const fallbackBounds = {
	bounds: {
		width: 0,
		height: 0,
		x: 0,
		y: 0,
		pageX: 0,
		pageY: 0,
	},
	styles: {},
};

export const getBounds = (props: GetBoundsParams): BoundEntry => {
	"worklet";
	console.warn("[react-native-screen-transitions] getBounds is deprecated.");
	return fallbackBounds;
};
