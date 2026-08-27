import {
	getPairKeyForDestination,
	getResolvedLink,
} from "../../../stores/bounds/internals/links";
import type {
	BoundsInterpolationProps,
	BoundsLink,
} from "../../../types/bounds.types";
import type { BoundId } from "../types/options";

type GetProps = () => BoundsInterpolationProps;

export type LinkAccessor = {
	getLink: (tag: BoundId) => BoundsLink | null;
};

export const createLinkAccessor = (getProps: GetProps): LinkAccessor => {
	"worklet";

	const getLink = (tag: BoundId): BoundsLink | null => {
		"worklet";
		const props = getProps();
		const stringTag = String(tag);
		const destinationScreenKey =
			props.next?.route.key ?? props.current?.route.key;
		const pairKey = destinationScreenKey
			? getPairKeyForDestination(stringTag, destinationScreenKey)
			: null;
		if (!pairKey) return null;

		const resolved = getResolvedLink(pairKey, stringTag);
		return resolved.link
			? {
					id: resolved.tag,
					...resolved.link,
				}
			: null;
	};

	return {
		getLink,
	};
};
