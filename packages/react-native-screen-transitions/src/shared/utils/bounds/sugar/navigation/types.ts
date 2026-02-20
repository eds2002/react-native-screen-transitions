import type { ScreenInterpolationProps } from "../../../../types/animation.types";
import type {
	BoundsNavigationOptions,
	BoundsNavigationPreset,
} from "../../../../types/bounds.types";
import type { BoundsOptions } from "../../types/options";

export type ResolveTag = (params: {
	id?: string;
	group?: string;
}) => string | undefined;

export type ComputeRaw = (
	overrides: Partial<BoundsOptions>,
) => Record<string, unknown>;

export type BuildNavigationStylesParams = {
	id: string;
	group?: string;
	preset: BoundsNavigationPreset;
	navigationOptions?: BoundsNavigationOptions;
	props: Omit<ScreenInterpolationProps, "bounds">;
	resolveTag: ResolveTag;
	computeRaw: ComputeRaw;
};
