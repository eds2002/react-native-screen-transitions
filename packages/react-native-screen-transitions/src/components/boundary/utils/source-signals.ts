import { getLinkKeyFromTag } from "../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../stores/bounds/types";

const SOURCE_SIGNAL_PREFIX = "source|";

type SourceCaptureSignal = {
	pairKey: ScreenPairKey;
	signal: string;
};

export const getInitialSourceCaptureSignal = (params: {
	enabled: boolean;
	sourcePairKey?: ScreenPairKey;
	linkId: string;
	group?: string;
	linkState?: LinkPairsState;
}): SourceCaptureSignal | null => {
	"worklet";
	const { enabled, sourcePairKey, linkId, group, linkState } = params;

	if (!enabled || !sourcePairKey) {
		return null;
	}

	const pair = linkState?.[sourcePairKey];
	const linkKey = getLinkKeyFromTag(linkId);
	const link = pair?.links?.[linkKey];
	const hasSourceRequest = pair?.sourceRequests?.[linkKey];

	if ((!link?.destination && !hasSourceRequest) || link?.source) {
		return null;
	}

	if (group) {
		const activeId = linkState?.[sourcePairKey]?.groups?.[group]?.activeId;

		// Passive grouped sources should not measure every mounted item. Once a
		// group has an active id, only that concrete member can auto-capture.
		if (activeId && activeId !== linkKey) {
			return null;
		}
	}

	const signalParts = group ? [group, linkKey] : [linkKey];

	return {
		pairKey: sourcePairKey,
		signal: `${SOURCE_SIGNAL_PREFIX}${sourcePairKey}|${signalParts.join("|")}`,
	};
};
