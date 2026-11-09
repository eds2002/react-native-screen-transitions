import type { LinkPairsState, ScreenPairKey } from "../../../stores/bounds";
import { getLinkKeyFromTag, isActiveGroupMember } from "../../../stores/bounds";

type InitialDestinationMeasurementAction =
	| "wait"
	| "release"
	| "measure"
	| "complete";

export type InitialDestinationMeasurementSignal = {
	pairKey: ScreenPairKey | null;
	action: InitialDestinationMeasurementAction;
};

export const getInitialDestinationMeasurementSignal = (params: {
	enabled: boolean;
	pairKey?: ScreenPairKey;
	linkId: string;
	group?: string;
	destinationPresent: boolean;
	sourcePresent: boolean;
	linkState?: LinkPairsState;
}): InitialDestinationMeasurementSignal | null => {
	"worklet";
	const {
		enabled,
		pairKey,
		linkId,
		group,
		destinationPresent,
		sourcePresent,
		linkState,
	} = params;
	if (!enabled) {
		return null;
	}

	if (!pairKey) {
		return { pairKey: null, action: "wait" };
	}

	if (!destinationPresent) {
		return { pairKey, action: "wait" };
	}

	if (!sourcePresent) {
		return { pairKey, action: "release" };
	}

	const linkKey = getLinkKeyFromTag(linkId);
	if (group && !isActiveGroupMember(linkState, pairKey, group, linkKey)) {
		return { pairKey, action: "release" };
	}

	const link = linkState?.[pairKey]?.links?.[linkKey];

	if (!link?.destination) {
		return { pairKey, action: "measure" };
	}

	if (!link.source) {
		return { pairKey, action: "wait" };
	}

	return { pairKey, action: "complete" };
};
