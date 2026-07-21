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

export const isHandoffHostClosingComplete = ({
	closing,
	progressAnimating,
	progressSettled,
	willAnimate,
}: {
	closing: number;
	progressAnimating: number;
	progressSettled: number;
	willAnimate: number;
}) => {
	"worklet";

	// A close request marks `closing` before its animation starts. Springs can
	// also enter their settle-distance threshold before their final frame.
	return (
		!!closing &&
		willAnimate === 0 &&
		progressSettled === 1 &&
		progressAnimating === 0
	);
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

export const canSwitchHandoffHostImmediately = ({
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

const resolveHandoffStyleOwnerScreenKey = ({
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
	handoff,
	isSettledHostClosingComplete = false,
	isSettledHostReady = false,
	pairsState,
	settledHostScreenKey = null,
	sourcePairKey,
}: {
	boundaryId: string;
	currentScreenKey: ScreenKey;
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

	if (isSettledHostClosingComplete && settledHostScreenKey === hostScreenKey) {
		hostScreenKey = getSourceScreenKeyFromPairKey(ownerPairKey);
	}

	const ownerScreenKey = resolveHandoffStyleOwnerScreenKey({
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
