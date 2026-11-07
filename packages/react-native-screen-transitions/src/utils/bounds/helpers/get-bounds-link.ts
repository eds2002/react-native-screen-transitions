import {
	getPairKeyForDestination,
	getResolvedLink,
} from "../../../stores/bounds";
import type {
	BoundsInterpolationProps,
	BoundsLink,
} from "../../../types/bounds.types";

/**
 * The link of a bound in the pair this screen's transition shows: the pair into the next screen
 * while it is on top, into this screen otherwise.
 */
export const getBoundsLink = (
	props: BoundsInterpolationProps,
	tag: string,
): BoundsLink | null => {
	"worklet";
	const destinationScreenKey =
		props.next?.route.key ?? props.current?.route.key;
	const pairKey = destinationScreenKey
		? getPairKeyForDestination(tag, destinationScreenKey)
		: null;
	if (!pairKey) return null;
	const resolved = getResolvedLink(pairKey, tag);
	return resolved.link ? { id: resolved.tag, ...resolved.link } : null;
};
