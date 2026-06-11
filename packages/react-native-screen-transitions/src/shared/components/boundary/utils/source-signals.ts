import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../stores/bounds/types";

const SOURCE_SIGNAL_PREFIX = "source|";

type SourceCaptureSignal = {
	pairKey: ScreenPairKey;
	signal: string;
};

const buildSourceSignal = (
	pairKey: ScreenPairKey,
	key: string,
): SourceCaptureSignal => {
	"worklet";
	return {
		pairKey,
		signal: `${SOURCE_SIGNAL_PREFIX}${pairKey}|${key}`,
	};
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

	// Trigger components capture on press. Passive Boundary.View sources wait for
	// their destination side to attach, then capture into the same assigned pair.
	if (!shouldAutoMeasure) {
		return null;
	}

	const link = linkState?.[sourcePairKey]?.links?.[linkId];

	if (!link?.destination || link.source) {
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

	return buildSourceSignal(sourcePairKey, signalParts.join("|"));
};
