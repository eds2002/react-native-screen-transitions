import {
	createPendingPairKey,
	getActiveGroupId,
	getLinkKeyFromTag,
	getSourceScreenKeyFromPairKey,
} from "../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../stores/bounds/types";

const hasPendingSourceLinks = (
	linkState: LinkPairsState | undefined,
	pendingPairKey: ScreenPairKey,
) => {
	"worklet";
	const links = linkState?.[pendingPairKey]?.links;

	if (!links) {
		return false;
	}

	for (const key in links) {
		if (links[key]?.source) {
			return true;
		}
	}

	return false;
};

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

	const sourceScreenKey = getSourceScreenKeyFromPairKey(measurePairKey);
	const pendingPairKey = createPendingPairKey(sourceScreenKey);
	const hasPendingSources = hasPendingSourceLinks(linkState, pendingPairKey);
	const pendingSource = linkState?.[pendingPairKey]?.links?.[linkKey]?.source;

	if (hasPendingSources && !pendingSource) {
		return null;
	}

	const activeGroupId =
		group && linkState
			? getActiveGroupId(linkState, measurePairKey, group)
			: null;

	if (!hasPendingSources && activeGroupId && activeGroupId !== linkKey) {
		return null;
	}

	return measurePairKey;
};
