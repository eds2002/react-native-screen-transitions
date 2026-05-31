import { createScreenPairKey } from "../../../stores/bounds/helpers/link-pairs.helpers";
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
	nextScreenKey?: string;
	currentScreenKey?: string;
	linkId: string;
	group?: string;
	shouldAutoMeasure: boolean;
	linkState?: LinkPairsState;
}): SourceCaptureSignal | null => {
	"worklet";
	const {
		enabled,
		nextScreenKey,
		currentScreenKey,
		linkId,
		group,
		shouldAutoMeasure,
		linkState,
	} = params;

	if (!enabled || !nextScreenKey || !currentScreenKey) {
		return null;
	}

	// Trigger components capture on press. This passive path is for Boundary.View
	// slots that need a source before navigation starts.
	if (!shouldAutoMeasure) {
		return null;
	}

	const pairKey = createScreenPairKey(currentScreenKey, nextScreenKey);

	if (group) {
		const activeId = linkState?.[pairKey]?.groups?.[group]?.activeId;

		// Passive grouped sources should not measure every mounted item. Once a
		// group has an active id, only that concrete member can auto-capture.
		if (activeId && activeId !== linkId) {
			return null;
		}
	}

	const signalParts = group
		? [currentScreenKey, nextScreenKey, group, linkId]
		: [currentScreenKey, nextScreenKey, linkId];

	return buildSourceSignal(pairKey, signalParts.join("|"));
};
