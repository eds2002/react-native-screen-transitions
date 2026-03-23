import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import type {
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "../../../types/animation.types";
import type {
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
} from "../../../types/bounds.types";

export type ZoomInterpolatedStyle = TransitionInterpolatedStyle & {
	content?: TransitionSlotStyle;
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: TransitionSlotStyle;
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: TransitionSlotStyle;
};

export type BuildZoomStylesParams = {
	resolvedTag?: string;
	zoomOptions?: BoundsNavigationZoomOptions;
	props: BoundsInterpolationProps;
};
