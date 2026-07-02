import {
	getDestinationScreenKeyFromPairKey,
	getLinkKeyFromTag,
	getLink as getPairLink,
	getSourceScreenKeyFromPairKey,
} from "../../../../stores/bounds/helpers/link-pairs.helpers";
import type {
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

export const usesEscapeClippingHost = (
	link: TagLink | null | undefined,
): boolean => {
	"worklet";
	return link?.source?.handoff === true && link.source.escapeClipping === true;
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

export const canSwitchBoundaryLocalHandoffImmediately = ({
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

const isActiveHandoffLink = ({
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

const resolveBoundaryLocalStyleOwnerScreenKey = ({
	hostScreenKey,
	isSettledHostReady,
	settledHostScreenKey,
	sourceScreenKey,
}: {
	hostScreenKey: ScreenKey;
	isSettledHostReady: boolean;
	settledHostScreenKey?: ScreenKey | null;
	sourceScreenKey: ScreenKey;
}): ScreenKey => {
	"worklet";
	if (settledHostScreenKey === hostScreenKey && isSettledHostReady) {
		return hostScreenKey;
	}

	return sourceScreenKey;
};

const pendingSignal = (sourcePairKey: ScreenPairKey): PortalOwnershipSignal => {
	"worklet";
	return {
		hostScreenKey: null,
		ownerPairKey: sourcePairKey,
		ownerScreenKey: null,
		status: "pending",
	};
};

const clearSignal = (sourcePairKey: ScreenPairKey): PortalOwnershipSignal => {
	"worklet";
	return {
		hostScreenKey: null,
		ownerPairKey: sourcePairKey,
		ownerScreenKey: null,
		status: "clear",
	};
};

export const resolveBoundaryPortalOwnership = ({
	boundaryId,
	currentScreenKey,
	escapeClipping,
	handoff,
	isSettledHostClosingComplete = false,
	isSettledHostReady = false,
	pairsState,
	settledHostScreenKey = null,
	sourcePairKey,
}: {
	boundaryId: string;
	currentScreenKey: ScreenKey;
	escapeClipping: boolean;
	handoff: boolean;
	isSettledHostClosingComplete?: boolean;
	isSettledHostReady?: boolean;
	pairsState: LinkPairsState;
	settledHostScreenKey?: ScreenKey | null;
	sourcePairKey: ScreenPairKey;
}): PortalOwnershipSignal => {
	"worklet";
	const linkKey = getLinkKeyFromTag(boundaryId);
	const link = getPairLink(pairsState, sourcePairKey, linkKey);

	if (link?.status !== "complete") {
		return pendingSignal(sourcePairKey);
	}

	if (
		!isActiveHandoffLink({
			link,
			linkKey,
			pairKey: sourcePairKey,
			pairsState,
		})
	) {
		return clearSignal(sourcePairKey);
	}

	if (!handoff) {
		return {
			hostScreenKey: currentScreenKey,
			ownerPairKey: sourcePairKey,
			ownerScreenKey: currentScreenKey,
			status: "complete",
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

			if (!candidate.source.handoff) {
				continue;
			}

			if (
				!isActiveHandoffLink({
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
			return pendingSignal(ownerPairKey);
		}

		break;
	}

	const ownerLink = getPairLink(pairsState, ownerPairKey, linkKey);
	const ownerUsesEscapeClipping =
		ownerLink?.source?.escapeClipping ?? escapeClipping;

	if (
		!ownerUsesEscapeClipping &&
		isSettledHostClosingComplete &&
		settledHostScreenKey === hostScreenKey &&
		previousOwnerPairKey
	) {
		hostScreenKey = getSourceScreenKeyFromPairKey(ownerPairKey);
	}

	const ownerScreenKey = ownerUsesEscapeClipping
		? getSourceScreenKeyFromPairKey(ownerPairKey)
		: resolveBoundaryLocalStyleOwnerScreenKey({
				hostScreenKey,
				isSettledHostReady,
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

export const hasHandoffEscapeContinuation = ({
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

			if (usesEscapeClippingHost(link)) {
				return true;
			}

			if (!link.source.handoff) {
				return false;
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
