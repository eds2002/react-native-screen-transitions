import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../../constants";
import type {
	BoundsInterpolationProps,
	BoundsNavigationRevealStyle,
} from "../../../../types/bounds.types";

export type RevealInterpolatedStyle = BoundsNavigationRevealStyle & {
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: BoundsNavigationRevealStyle[typeof NAVIGATION_MASK_CONTAINER_STYLE_ID];
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: BoundsNavigationRevealStyle[typeof NAVIGATION_MASK_ELEMENT_STYLE_ID];
};

export type BuildRevealStylesParams = {
	tag?: string;
	props: BoundsInterpolationProps;
};
