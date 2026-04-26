import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import type {
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
} from "../../../types/bounds.types";

export type ZoomInterpolatedStyle = BoundsNavigationZoomStyle & {
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: BoundsNavigationZoomStyle[typeof NAVIGATION_MASK_CONTAINER_STYLE_ID];
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: BoundsNavigationZoomStyle[typeof NAVIGATION_MASK_ELEMENT_STYLE_ID];
};

export type BuildZoomStylesParams = {
	tag?: string;
	zoomOptions?: BoundsNavigationZoomOptions;
	props: BoundsInterpolationProps;
};
