import {
	getDestinationScreenKeyFromPairKey,
	getLinkKeyFromTag,
	getLink as getPairLink,
	getSourceScreenKeyFromPairKey,
} from "../../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	BoundsPortalHost,
	LinkKey,
	LinkPairsState,
	ScreenKey,
	ScreenPairKey,
	TagLink,
} from "../../../../stores/bounds/types";

export type PortalOwnershipSignal =
	| {
			hostScreenKey: null;
			ownerPairKey?: ScreenPairKey;
			ownerScreenKey: null;
			status: "clear" | "pending";
	  }
	| {
			hostScreenKey: ScreenKey;
			ownerPairKey: ScreenPairKey;
			ownerScreenKey: ScreenKey;
			status: "complete";
	  };

const hasSeenScreenKey = (screenKeys: ScreenKey[], screenKey: ScreenKey) => {
	"worklet";
	for (let index = 0; index < screenKeys.length; index++) {
		if (screenKeys[index] === screenKey) {
			return true;
		}
	}
	return false;
};

export const usesScreenPortalHost = (
	link: TagLink | null | undefined,
): boolean => {
	"worklet";
	return link?.source?.portalHost === "screen";
};

const isReturningToPreviousSourceHost = ({
	hostScreenKey,
	ownerPairKey,
	previousOwnerPairKey,
}: {
	hostScreenKey: ScreenKey;
	ownerPairKey: ScreenPairKey;
	previousOwnerPairKey: ScreenPairKey;
}) => {
	"worklet";
	const previousSourceScreenKey =
		getSourceScreenKeyFromPairKey(previousOwnerPairKey);
	const previousDestinationScreenKey =
		getDestinationScreenKeyFromPairKey(previousOwnerPairKey);
	const ownerDestinationScreenKey =
		getDestinationScreenKeyFromPairKey(ownerPairKey);

	return (
		previousDestinationScreenKey !== "" &&
		ownerDestinationScreenKey !== "" &&
		previousDestinationScreenKey !== previousSourceScreenKey &&
		ownerDestinationScreenKey === previousSourceScreenKey &&
		hostScreenKey === previousSourceScreenKey
	);
};

export const canSwitchBoundaryLocalPortalHostImmediately = ({
	hostScreenKey,
	ownerPairKey,
	previousOwnerPairKey,
}: {
	hostScreenKey: ScreenKey | null;
	ownerPairKey?: ScreenPairKey;
	previousOwnerPairKey?: ScreenPairKey;
}) => {
	"worklet";
	if (!hostScreenKey || !ownerPairKey) {
		return false;
	}

	if (hostScreenKey === getSourceScreenKeyFromPairKey(ownerPairKey)) {
		return true;
	}

	if (!previousOwnerPairKey) {
		return false;
	}

	return isReturningToPreviousSourceHost({
		hostScreenKey,
		ownerPairKey,
		previousOwnerPairKey,
	});
};

const isActivePortalLink = ({
	link,
	linkKey,
	pairKey,
	pairsState,
}: {
	link: TagLink;
	linkKey: LinkKey;
	pairKey: ScreenPairKey;
	pairsState: LinkPairsState;
}) => {
	"worklet";
	if (!link.group) {
		return true;
	}

	const activeId = pairsState[pairKey]?.groups?.[link.group]?.activeId;
	return !activeId || activeId === linkKey;
};

const resolvePortalOwnerScreenKey = ({
	hostScreenKey,
	isSettledHostReady,
	portalHost,
	settledHostScreenKey,
	sourceScreenKey,
}: {
	hostScreenKey: ScreenKey;
	isSettledHostReady: boolean;
	portalHost?: BoundsPortalHost;
	settledHostScreenKey?: ScreenKey | null;
	sourceScreenKey: ScreenKey;
}): ScreenKey => {
	"worklet";
	if (portalHost === "screen") {
		return sourceScreenKey;
	}

	if (
		portalHost === "boundary-local" &&
		settledHostScreenKey === hostScreenKey &&
		isSettledHostReady
	) {
		return hostScreenKey;
	}

	return sourceScreenKey;
};

export const resolveMatchedScreenPortalOwnership = ({
	boundaryId,
	isSettledHostClosingComplete = false,
	isSettledHostReady = false,
	pairsState,
	portalHost,
	settledHostScreenKey = null,
	sourcePairKey,
}: {
	boundaryId: string;
	isSettledHostClosingComplete?: boolean;
	isSettledHostReady?: boolean;
	pairsState: LinkPairsState;
	portalHost: BoundsPortalHost;
	settledHostScreenKey?: ScreenKey | null;
	sourcePairKey: ScreenPairKey;
}): PortalOwnershipSignal => {
	"worklet";
	const linkKey = getLinkKeyFromTag(boundaryId);
	const link = getPairLink(pairsState, sourcePairKey, linkKey);

	if (link?.status !== "complete") {
		return {
			hostScreenKey: null,
			ownerPairKey: sourcePairKey,
			ownerScreenKey: null,
			status: "pending",
		};
	}

	if (
		!isActivePortalLink({
			link,
			linkKey,
			pairKey: sourcePairKey,
			pairsState,
		})
	) {
		return {
			hostScreenKey: null,
			ownerPairKey: sourcePairKey,
			ownerScreenKey: null,
			status: "clear",
		};
	}

	let hostScreenKey = link.destination.screenKey;
	let ownerPairKey = sourcePairKey;
	let previousOwnerPairKey: ScreenPairKey | null = null;
	const seenScreenKeys: ScreenKey[] = [
		getSourceScreenKeyFromPairKey(sourcePairKey),
		hostScreenKey,
	];

	const pairKeys = Object.keys(pairsState);

	for (let hop = 0; hop < pairKeys.length; hop++) {
		let didAdvance = false;
		let hasPendingNextHop = false;
		let didHitVisitedScreen = false;

		for (let index = 0; index < pairKeys.length; index++) {
			const candidatePairKey = pairKeys[index];
			if (!candidatePairKey || candidatePairKey === ownerPairKey) {
				continue;
			}

			const candidate = getPairLink(pairsState, candidatePairKey, linkKey);
			if (!candidate?.source || candidate.source.screenKey !== hostScreenKey) {
				continue;
			}

			if (
				!isActivePortalLink({
					link: candidate,
					linkKey,
					pairKey: candidatePairKey,
					pairsState,
				})
			) {
				continue;
			}

			if (candidate.status !== "complete") {
				hasPendingNextHop = true;
				continue;
			}

			const nextHostScreenKey = candidate.destination.screenKey;

			previousOwnerPairKey = ownerPairKey;
			ownerPairKey = candidatePairKey;
			hostScreenKey = nextHostScreenKey;

			if (hasSeenScreenKey(seenScreenKeys, nextHostScreenKey)) {
				didHitVisitedScreen = true;
				break;
			}

			seenScreenKeys.push(nextHostScreenKey);
			didAdvance = true;
			break;
		}

		if (didHitVisitedScreen) {
			break;
		}

		if (didAdvance) {
			continue;
		}

		if (hasPendingNextHop) {
			return {
				hostScreenKey: null,
				ownerPairKey,
				ownerScreenKey: null,
				status: "pending",
			};
		}

		break;
	}

	if (
		portalHost === "boundary-local" &&
		isSettledHostClosingComplete &&
		settledHostScreenKey === hostScreenKey &&
		previousOwnerPairKey
	) {
		hostScreenKey = getSourceScreenKeyFromPairKey(ownerPairKey);
	}

	const ownerLink = getPairLink(pairsState, ownerPairKey, linkKey);
	const ownerScreenKey = resolvePortalOwnerScreenKey({
		hostScreenKey,
		isSettledHostReady,
		portalHost: ownerLink?.source?.portalHost ?? portalHost,
		settledHostScreenKey,
		sourceScreenKey: getSourceScreenKeyFromPairKey(ownerPairKey),
	});

	return {
		hostScreenKey,
		ownerPairKey,
		ownerScreenKey,
		status: "complete",
	};
};

export const hasMatchedScreenPortalContinuation = ({
	linkKey,
	linkState,
	sourceScreenKey,
}: {
	linkKey: string;
	linkState: LinkPairsState;
	sourceScreenKey: ScreenKey;
}) => {
	"worklet";
	const pairKeys = Object.keys(linkState);
	const visitedScreenKeys: ScreenKey[] = [];
	let cursorScreenKey = sourceScreenKey;

	for (let hop = 0; hop < pairKeys.length; hop++) {
		if (hasSeenScreenKey(visitedScreenKeys, cursorScreenKey)) {
			return false;
		}
		visitedScreenKeys.push(cursorScreenKey);

		let previousScreenKey: ScreenKey | null = null;
		for (let index = 0; index < pairKeys.length; index++) {
			const candidatePairKey = pairKeys[index];
			const link = candidatePairKey
				? linkState[candidatePairKey]?.links?.[linkKey]
				: null;

			if (
				!link?.source ||
				!link.destination ||
				link.destination.screenKey !== cursorScreenKey
			) {
				continue;
			}

			if (usesScreenPortalHost(link)) {
				return true;
			}

			previousScreenKey = link.source.screenKey;
			break;
		}

		if (!previousScreenKey) {
			return false;
		}

		cursorScreenKey = previousScreenKey;
	}

	return false;
};
