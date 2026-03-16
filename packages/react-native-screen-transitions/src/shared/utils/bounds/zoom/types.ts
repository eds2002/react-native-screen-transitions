import type { BoundsNavigationZoomOptions } from "../../../types/bounds.types";
import type { BoundsFrameProps } from "../types/frame-props";
import type { BoundId, BoundsOptions } from "../types/options";

export type ResolveTag = (params: {
	id?: BoundId;
	group?: string;
}) => string | undefined;

export type ComputeRaw = (
	overrides: Partial<BoundsOptions>,
	frameProps?: BoundsFrameProps,
) => Record<string, unknown>;

export type BuildZoomStylesParams = {
	id: BoundId;
	group?: string;
	zoomOptions?: BoundsNavigationZoomOptions;
	props: BoundsFrameProps;
	resolveTag: ResolveTag;
	computeRaw: ComputeRaw;
};
