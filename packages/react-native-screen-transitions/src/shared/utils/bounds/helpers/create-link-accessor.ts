import { getEntry } from "../../../stores/bounds/internals/entries";
import { getResolvedLink } from "../../../stores/bounds/internals/links";
import type {
	MeasuredEntry,
	ResolvedTransitionPair,
	TagLink,
} from "../../../stores/bounds/types";
import type {
	BoundsInterpolationProps,
	BoundsLink,
	BoundsLinkComputeOptions,
} from "../../../types/bounds.types";
import type { BoundId, BoundsOptionsResult } from "../types/options";
import { prepareBoundStyles } from "./prepare-bound-styles";
import { resolveBoundsPairKey } from "./resolve-bounds-pair-key";

type GetProps = () => BoundsInterpolationProps;

export type LinkAccessor = {
	getMeasured: (tag: BoundId, key?: string) => MeasuredEntry | null;
	getSnapshot: (tag: BoundId, key?: string) => MeasuredEntry | null;
	getLink: (tag: BoundId) => BoundsLink | null;
};

const toResolvedPair = (link: TagLink): ResolvedTransitionPair => {
	"worklet";
	return {
		sourceBounds: link.source.bounds,
		destinationBounds: link.destination?.bounds ?? null,
		sourceStyles: link.source.styles,
		destinationStyles: link.destination?.styles ?? null,
		sourceScreenKey: link.source.screenKey,
		destinationScreenKey: link.destination?.screenKey ?? null,
	};
};

export const createLinkAccessor = (getProps: GetProps): LinkAccessor => {
	"worklet";

	const getMeasured = (tag: BoundId, key?: string): MeasuredEntry | null => {
		"worklet";
		if (!key) return null;
		const entry = getEntry(String(tag), key);
		return entry?.bounds ? (entry as MeasuredEntry) : null;
	};

	const getSnapshot = (tag: BoundId, key?: string): MeasuredEntry | null => {
		"worklet";
		return getMeasured(tag, key);
	};

	const getLink = (tag: BoundId): BoundsLink | null => {
		"worklet";
		const props = getProps();
		const stringTag = String(tag);
		const pairKey = resolveBoundsPairKey(props);
		const resolved = pairKey
			? getResolvedLink(pairKey, stringTag)
			: { tag: stringTag, link: null };
		const selectedTag = resolved.tag;
		const link = resolved.link;

		if (!link) return null;
		const resolvedPair = toResolvedPair(link);

		return {
			id: selectedTag,
			source: link.source
				? { bounds: link.source.bounds, styles: link.source.styles }
				: null,
			destination: link.destination
				? { bounds: link.destination.bounds, styles: link.destination.styles }
				: null,
			initialSource: link.initialSource
				? {
						bounds: link.initialSource.bounds,
						styles: link.initialSource.styles,
					}
				: null,
			initialDestination: link.initialDestination
				? {
						bounds: link.initialDestination.bounds,
						styles: link.initialDestination.styles,
					}
				: null,
			compute: <T extends BoundsLinkComputeOptions>(
				computeOptions: T,
			): BoundsOptionsResult<T & { id: string }> => {
				"worklet";
				return prepareBoundStyles({
					props,
					options: {
						...computeOptions,
						id: selectedTag,
					} as T & { id: string },
					resolvedPair,
				});
			},
		};
	};

	return {
		getMeasured,
		getSnapshot,
		getLink,
	};
};
