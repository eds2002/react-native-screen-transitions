import type {
	BoundsNavigationOptions,
	BoundsNavigationPreset,
} from "../../../../types/bounds.types";
import type { Layout } from "../../../../types/screen.types";
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
	focused: boolean;
	progress: number;
	currentProgress: number;
	currentRouteKey?: string;
	screenLayout: Layout;
	activeClosing: number;
	activeGestureX: number;
	activeGestureY: number;
	resolveTag: ResolveTag;
	computeRaw: ComputeRaw;
};
