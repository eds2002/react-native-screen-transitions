import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import type {
	BoundsInterpolationProps,
	BoundsNavigationContainerRevealStyle,
} from "../../../types/bounds.types";

export type ContainerRevealInterpolatedStyle =
	BoundsNavigationContainerRevealStyle & {
		[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: BoundsNavigationContainerRevealStyle[typeof NAVIGATION_MASK_CONTAINER_STYLE_ID];
		[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: BoundsNavigationContainerRevealStyle[typeof NAVIGATION_MASK_ELEMENT_STYLE_ID];
	};

export type BuildContainerRevealStylesParams = {
	tag?: string;
	props: BoundsInterpolationProps;
};
