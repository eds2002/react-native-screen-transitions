import {
	getActiveGroupId,
	getLinkKeyFromTag,
} from "../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../stores/bounds/types";

export type InitialDestinationMeasurementAction =
	| "wait"
	| "release"
	| "measure"
	| "complete";

export type InitialDestinationMeasurementSignal = {
	pairKey: ScreenPairKey;
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
	if (!enabled || !pairKey) {
		return null;
	}

	if (!destinationPresent) {
		return { pairKey, action: "wait" };
	}

	if (!sourcePresent) {
		return { pairKey, action: "release" };
	}

	const linkKey = getLinkKeyFromTag(linkId);
	const activeGroupId =
		group && linkState ? getActiveGroupId(linkState, pairKey, group) : null;

	if (activeGroupId && activeGroupId !== linkKey) {
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
