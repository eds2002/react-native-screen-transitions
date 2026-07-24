import { getLinkKeyFromTag } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	LinkPairsState,
	ScreenKey,
	ScreenPairKey,
} from "../../../../stores/bounds/types";

type ResolveEnteringHandoffTargetParams = {
	animationProgress: number;
	boundaryId: string;
	currentScreenKey: ScreenKey;
	pairsState: LinkPairsState;
	sourcePairKey?: ScreenPairKey;
};

/** Resolve only the immediate A -> B entering handoff. */
export const resolveEnteringHandoffTarget = ({
	animationProgress,
	boundaryId,
	currentScreenKey,
	pairsState,
	sourcePairKey,
}: ResolveEnteringHandoffTargetParams): ScreenKey | null => {
	"worklet";

	if (!sourcePairKey || animationProgress <= 0) {
		return null;
	}

	const pair = pairsState[sourcePairKey];
	const linkKey = getLinkKeyFromTag(boundaryId);
	const link = pair?.links[linkKey];

	if (
		link?.status !== "complete" ||
		link.source.screenKey !== currentScreenKey ||
		!link.source.handoff ||
		!link.destination.handoff
	) {
		return null;
	}

	if (link.group && pair.groups[link.group]?.activeId !== linkKey) {
		return null;
	}

	return link.destination.screenKey;
};
