import type {
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
} from "../../../types/bounds.types";

export type BuildZoomStylesParams = {
	resolvedTag?: string;
	zoomOptions?: BoundsNavigationZoomOptions;
	props: BoundsInterpolationProps;
};
