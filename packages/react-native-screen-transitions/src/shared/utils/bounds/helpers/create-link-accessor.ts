import { requestBoundaryMeasurements } from "../../../stores/bounds/internals/coordinator";
import {
	getPairKeyForDestination,
	getResolvedLink,
} from "../../../stores/bounds/internals/links";
import type {
	BoundsInterpolationProps,
	BoundsLink,
} from "../../../types/bounds.types";
import type { BoundId } from "../types/options";
import { resolveBoundsPairKey } from "./resolve-bounds-pair-key";

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
		const requestedPairKey = resolveBoundsPairKey(props);
		if (requestedPairKey) {
			requestBoundaryMeasurements({
				pairKey: requestedPairKey,
				tag: stringTag,
				destination: true,
				refresh: !!props.active.willAnimate,
			});
		}
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
