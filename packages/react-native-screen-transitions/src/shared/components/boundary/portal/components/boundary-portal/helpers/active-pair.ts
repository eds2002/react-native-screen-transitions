import { getLinkKeyFromTag } from "../../../../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../../../../stores/bounds/types";

type HasActiveBoundaryPortalLinkParams = {
	boundaryId: string;
	pairsState: LinkPairsState;
	sourcePairKey?: ScreenPairKey;
};

export const hasActiveBoundaryPortalLink = ({
	boundaryId,
	pairsState,
	sourcePairKey,
}: HasActiveBoundaryPortalLinkParams): boolean => {
	"worklet";
	if (!sourcePairKey) {
		return false;
	}

	const pair = pairsState[sourcePairKey];
	const linkKey = getLinkKeyFromTag(boundaryId);
	const link = pair?.links[linkKey];

	if (!link?.source) {
		return false;
	}

	if (link.group && pair.groups[link.group]?.activeId !== linkKey) {
		return false;
	}

	return true;
};
