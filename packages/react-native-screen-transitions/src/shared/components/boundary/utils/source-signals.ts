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
	shouldAutoMeasure: boolean;
	linkState?: LinkPairsState;
}): SourceCaptureSignal | null => {
	"worklet";
	const {
		enabled,
		sourcePairKey,
		linkId,
		group,
		shouldAutoMeasure,
		linkState,
	} = params;

	if (!enabled || !sourcePairKey) {
		return null;
	}

	if (!shouldAutoMeasure) {
		return null;
	}

	const pair = linkState?.[sourcePairKey];
	const link = pair?.links?.[linkId];
	const hasSourceRequest = pair?.sourceRequests?.[linkId];

	if ((!link?.destination && !hasSourceRequest) || link?.source) {
		return null;
	}

	if (group) {
		const activeId = linkState?.[sourcePairKey]?.groups?.[group]?.activeId;

		// Passive grouped sources should not measure every mounted item. Once a
		// group has an active id, only that concrete member can auto-capture.
		if (activeId && activeId !== linkId) {
			return null;
		}
	}

	const signalParts = group ? [group, linkId] : [linkId];

	return {
		pairKey: sourcePairKey,
		signal: `${SOURCE_SIGNAL_PREFIX}${sourcePairKey}|${signalParts.join("|")}`,
	};
};
