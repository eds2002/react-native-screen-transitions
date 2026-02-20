import { BoundStore } from "../../../../stores/bounds.store";
import type { BoundsNavigationOptions } from "../../../../types/bounds.types";
import type { BoundsOptions } from "../../types/options";
import type { ResolveTag } from "./types";

export const toNumber = (value: unknown, fallback = 0): number => {
	"worklet";
	return typeof value === "number" ? value : fallback;
};

export const resolveNavigationConfig = ({
	id,
	group,
	navigationOptions,
	currentRouteKey,
	resolveTag,
	defaultAnchor,
}: {
	id: string;
	group?: string;
	navigationOptions?: BoundsNavigationOptions;
	currentRouteKey?: string;
	resolveTag: ResolveTag;
	defaultAnchor: BoundsOptions["anchor"] | undefined;
}): {
	resolvedTag: string;
	sharedOptions: Partial<BoundsOptions>;
	explicitTarget: BoundsOptions["target"] | undefined;
} | null => {
	"worklet";
	const resolvedTag = resolveTag({ id, group });
	if (!resolvedTag) return null;

	const boundaryConfig = currentRouteKey
		? BoundStore.getBoundaryConfig(resolvedTag, currentRouteKey)
		: null;

	const sharedOptions: Partial<BoundsOptions> = {
		...(navigationOptions ?? {}),
		anchor:
			navigationOptions?.anchor ?? boundaryConfig?.anchor ?? defaultAnchor,
		scaleMode:
			navigationOptions?.scaleMode ?? boundaryConfig?.scaleMode ?? "uniform",
	};

	const explicitTarget = navigationOptions?.target ?? boundaryConfig?.target;

	return {
		resolvedTag,
		sharedOptions,
		explicitTarget,
	};
};
