import { BoundStore } from "../../../../stores/bounds";
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

	// Try direct boundary config for the current screen first.
	const boundaryConfig = currentRouteKey
		? BoundStore.getBoundaryConfig(resolvedTag, currentRouteKey)
		: null;

	// Fallback: when the current screen has no Boundary (e.g. a zoom detail
	// screen without a destination element), inherit config from the link's
	// source screen so that props like scaleMode propagate to both sides.
	let effectiveConfig = boundaryConfig;
	if (!effectiveConfig) {
		// For no-destination navigation zoom, the focused route won't appear in
		// a completed link yet. Fall back to the latest unscoped link so source
		// boundary defaults (anchor/scaleMode/target) still propagate.
		const scopedLink = currentRouteKey
			? BoundStore.getActiveLink(resolvedTag, currentRouteKey)
			: null;
		const link = scopedLink ?? BoundStore.getActiveLink(resolvedTag);
		if (link?.source) {
			effectiveConfig = BoundStore.getBoundaryConfig(
				resolvedTag,
				link.source.screenKey,
			);
		}
	}

	const sharedOptions: Partial<BoundsOptions> = {
		...(navigationOptions ?? {}),
		anchor:
			navigationOptions?.anchor ?? effectiveConfig?.anchor ?? defaultAnchor,
		scaleMode:
			navigationOptions?.scaleMode ?? effectiveConfig?.scaleMode ?? "uniform",
	};

	const explicitTarget = navigationOptions?.target ?? effectiveConfig?.target;

	return {
		resolvedTag,
		sharedOptions,
		explicitTarget,
	};
};
