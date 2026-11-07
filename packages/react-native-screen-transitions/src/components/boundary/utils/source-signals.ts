import type { LinkPairsState, ScreenPairKey } from "../../../stores/bounds";
import { getLinkKeyFromTag, isActiveGroupMember } from "../../../stores/bounds";

const SOURCE_SIGNAL_PREFIX = "source|";

type SourceCaptureSignal = {
	pairKey: ScreenPairKey;
	signal: string;
};

export const getInitialSourceCaptureSignal = (params: {
	sourcePairKey?: ScreenPairKey;
	linkId: string;
	group?: string;
	linkState?: LinkPairsState;
}): SourceCaptureSignal | null => {
	"worklet";
	const { sourcePairKey, linkId, group, linkState } = params;

	if (!sourcePairKey) {
		return null;
	}

	const pair = linkState?.[sourcePairKey];
	const linkKey = getLinkKeyFromTag(linkId);
	const link = pair?.links?.[linkKey];
	const hasSourceRequest = pair?.sourceRequests?.[linkKey];

	if ((!link?.destination && !hasSourceRequest) || link?.source) {
		return null;
	}

	// Passive grouped sources should not measure every mounted item: only the active member.
	if (group && !isActiveGroupMember(linkState, sourcePairKey, group, linkKey)) {
		return null;
	}

	const signalParts = group ? [group, linkKey] : [linkKey];

	return {
		pairKey: sourcePairKey,
		signal: `${SOURCE_SIGNAL_PREFIX}${sourcePairKey}|${signalParts.join("|")}`,
	};
};
