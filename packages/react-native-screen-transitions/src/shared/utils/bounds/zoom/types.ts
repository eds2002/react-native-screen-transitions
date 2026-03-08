import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsNavigationZoomOptions } from "../../../types/bounds.types";
import type { BoundId, BoundsOptions } from "../types/options";

export type ResolveTag = (params: {
	id?: BoundId;
	group?: string;
}) => string | undefined;

export type ComputeRaw = (
	overrides: Partial<BoundsOptions>,
	frameProps?: Omit<ScreenInterpolationProps, "bounds">,
) => Record<string, unknown>;

export type BuildZoomStylesParams = {
	id: BoundId;
	group?: string;
	zoomOptions?: BoundsNavigationZoomOptions;
	props: Omit<ScreenInterpolationProps, "bounds">;
	resolveTag: ResolveTag;
	computeRaw: ComputeRaw;
};
