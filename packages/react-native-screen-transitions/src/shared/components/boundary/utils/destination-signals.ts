import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../stores/bounds/types";

export const getInitialDestinationMeasurePairKey = (params: {
	enabled: boolean;
	destinationPairKey?: ScreenPairKey;
	ancestorDestinationPairKey?: ScreenPairKey;
	linkId: string;
	linkState?: LinkPairsState;
}): ScreenPairKey | null => {
	"worklet";
	const {
		enabled,
		destinationPairKey,
		ancestorDestinationPairKey,
		linkId,
		linkState,
	} = params;
	const measurePairKey = destinationPairKey ?? ancestorDestinationPairKey;

	if (!enabled || !measurePairKey) {
		return null;
	}

	const hasDestination =
		linkState?.[measurePairKey]?.links?.[linkId]?.destination;

	return hasDestination ? null : measurePairKey;
};
