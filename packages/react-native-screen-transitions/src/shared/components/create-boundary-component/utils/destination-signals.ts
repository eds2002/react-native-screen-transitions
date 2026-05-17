import {
	createPendingPairKey,
	createScreenPairKey,
	getDestinationScreenKeyFromPairKey,
	getSourceScreenKeyFromPairKey,
} from "../../../stores/bounds/helpers/link-pairs.helpers";
import {
	getDestination,
	getSource,
} from "../../../stores/bounds/internals/links";
import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../stores/bounds/types";

const findPendingSourcePairKey = (
	linkState: LinkPairsState | undefined,
	linkId: string,
): ScreenPairKey | null => {
	"worklet";
	if (!linkState) return null;

	for (const pairKey in linkState) {
		const sourceScreenKey = getSourceScreenKeyFromPairKey(pairKey);

		if (pairKey !== createPendingPairKey(sourceScreenKey)) {
			continue;
		}

		if (linkState[pairKey]?.links?.[linkId]?.source) {
			return pairKey;
		}
	}

	return null;
};

// Passive Boundary.View sources in nested routes can already live in the final
// ancestor pair, even before the destination side has attached.
const findAncestorSourcePairKey = (
	linkState: LinkPairsState | undefined,
	linkId: string,
	destinationScreenKey: string | undefined,
): ScreenPairKey | null => {
	"worklet";
	if (!linkState || !destinationScreenKey) return null;

	for (const pairKey in linkState) {
		if (getDestinationScreenKeyFromPairKey(pairKey) !== destinationScreenKey) {
			continue;
		}

		if (linkState[pairKey]?.links?.[linkId]?.source) {
			return pairKey;
		}
	}

	return null;
};

export const getInitialDestinationMeasurePairKey = (params: {
	enabled: boolean;
	currentScreenKey: string;
	preferredSourceScreenKey?: string;
	ancestorScreenKeys?: readonly string[];
	linkId: string;
	linkState?: LinkPairsState;
}): ScreenPairKey | null => {
	"worklet";
	const {
		enabled,
		currentScreenKey,
		preferredSourceScreenKey,
		ancestorScreenKeys,
		linkId,
		linkState,
	} = params;

	if (!enabled) {
		return null;
	}

	// Initial screens inside nested navigators measure concrete child views, but
	// the transition pair belongs to the nearest animated ancestor route.
	const ancestorPairKey = findAncestorSourcePairKey(
		linkState,
		linkId,
		ancestorScreenKeys?.[0],
	);

	// Trigger sources start as pending screen<> links. Boundary.View sources may
	// already be in the ancestor pair, so only scan pending when needed.
	const pendingSourcePairKey = preferredSourceScreenKey
		? createPendingPairKey(preferredSourceScreenKey)
		: ancestorPairKey
			? null
			: findPendingSourcePairKey(linkState, linkId);

	const sourceScreenKey = preferredSourceScreenKey
		? preferredSourceScreenKey
		: getSourceScreenKeyFromPairKey(
				ancestorPairKey ?? pendingSourcePairKey ?? "",
			);

	if (!sourceScreenKey) return null;

	// Non-nested destinations attach to their own route. Nested initial screens
	// attach to the animated ancestor route unless that pair already exists.
	const destinationScreenKey =
		ancestorPairKey || preferredSourceScreenKey || !ancestorScreenKeys?.[0]
			? currentScreenKey
			: ancestorScreenKeys[0];

	const destinationPairKey =
		ancestorPairKey ??
		createScreenPairKey(sourceScreenKey, destinationScreenKey);

	const hasDestinationLink =
		getDestination(destinationPairKey, linkId) !== null;

	const hasAttachableSourceLink =
		getSource(destinationPairKey, linkId) !== null ||
		(!!pendingSourcePairKey &&
			getSource(pendingSourcePairKey, linkId) !== null);

	return hasAttachableSourceLink && !hasDestinationLink
		? destinationPairKey
		: null;
};
