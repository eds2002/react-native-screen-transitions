import type {
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
} from "../../../../types/bounds.types";

export type ZoomInterpolatedStyle = BoundsNavigationZoomStyle;

export type BuildZoomStylesParams = {
	tag?: string;
	props: BoundsInterpolationProps;
	zoomOptions?: BoundsNavigationZoomOptions;
};
