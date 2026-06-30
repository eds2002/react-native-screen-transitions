import {
	getActiveGroupId,
	getLinkKeyFromTag,
} from "../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../stores/bounds/types";

export const getInitialDestinationMeasurePairKey = (params: {
	enabled: boolean;
	destinationPairKey?: ScreenPairKey;
	ancestorDestinationPairKey?: ScreenPairKey;
	linkId: string;
	group?: string;
	linkState?: LinkPairsState;
}): ScreenPairKey | null => {
	"worklet";
	const {
		enabled,
		destinationPairKey,
		ancestorDestinationPairKey,
		linkId,
		group,
		linkState,
	} = params;
	const measurePairKey = destinationPairKey ?? ancestorDestinationPairKey;

	if (!enabled || !measurePairKey) {
		return null;
	}

	const linkKey = getLinkKeyFromTag(linkId);
	const hasDestination =
		linkState?.[measurePairKey]?.links?.[linkKey]?.destination;

	if (hasDestination) {
		return null;
	}

	const activeGroupId =
		group && linkState
			? getActiveGroupId(linkState, measurePairKey, group)
			: null;

	if (activeGroupId && activeGroupId !== linkKey) {
		return null;
	}

	return measurePairKey;
};
