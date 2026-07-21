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
	destinationPairKey?: ScreenPairKey;
	ancestorDestinationPairKey?: ScreenPairKey;
	linkId: string;
	group?: string;
	destinationPresent: boolean;
	sourcePresent: boolean;
	linkState?: LinkPairsState;
}): InitialDestinationMeasurementSignal | null => {
	"worklet";
	const {
		enabled,
		destinationPairKey,
		ancestorDestinationPairKey,
		linkId,
		group,
		destinationPresent,
		sourcePresent,
		linkState,
	} = params;
	const pairKey = destinationPairKey ?? ancestorDestinationPairKey;

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
