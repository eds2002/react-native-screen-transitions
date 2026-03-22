import type {
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
} from "../../../types/bounds.types";
import type { BoundId, BoundsOptions } from "../types/options";

export type ResolveTag = (params: {
	id?: BoundId;
	group?: string;
}) => string | undefined;

export type ComputeRaw = (
	overrides: Partial<BoundsOptions>,
	frameProps?: BoundsInterpolationProps,
) => Record<string, unknown>;

export type BuildZoomStylesParams = {
	id: BoundId;
	group?: string;
	zoomOptions?: BoundsNavigationZoomOptions;
	props: BoundsInterpolationProps;
	resolveTag: ResolveTag;
	computeRaw: ComputeRaw;
};
