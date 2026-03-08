import type { ScreenInterpolationProps } from "../../../../types/animation.types";
import type { BoundsNavigationZoomOptions } from "../../../../types/bounds.types";
import type { BoundsOptions } from "../../types/options";

export type ResolveTag = (params: {
	id?: string;
	group?: string;
}) => string | undefined;

export type ComputeRaw = (
	overrides: Partial<BoundsOptions>,
	frameProps?: Omit<ScreenInterpolationProps, "bounds">,
) => Record<string, unknown>;

export type BuildNavigationStylesParams = {
	id: string;
	group?: string;
	navigationOptions?: BoundsNavigationZoomOptions;
	props: Omit<ScreenInterpolationProps, "bounds">;
	resolveTag: ResolveTag;
	computeRaw: ComputeRaw;
};
