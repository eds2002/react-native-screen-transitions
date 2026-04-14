import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type {
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
} from "../../../types/bounds.types";

export type ZoomInterpolatedStyle = BoundsNavigationZoomStyle & {
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: BoundsNavigationZoomStyle[typeof NAVIGATION_MASK_CONTAINER_STYLE_ID];
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: BoundsNavigationZoomStyle[typeof NAVIGATION_MASK_ELEMENT_STYLE_ID];
};

export type BuildZoomStylesParams = {
	resolvedTag?: string;
	zoomOptions?: BoundsNavigationZoomOptions;
	props: Omit<ScreenInterpolationProps, "bounds">;
};
