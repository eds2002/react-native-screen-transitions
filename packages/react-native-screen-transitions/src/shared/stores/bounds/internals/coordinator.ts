import type { SharedValue } from "react-native-reanimated";
import {
	ensurePairDestinationRequests,
	ensurePairGroups,
	ensurePairLinks,
	ensurePairSourceRequests,
	getDestinationScreenKeyFromPairKey,
	getGroupKeyFromTag,
	getLinkKeyFromTag,
	getSourceScreenKeyFromPairKey,
} from "../helpers/link-pairs.helpers";
import type {
	BoundsScreenNode,
	BoundTag,
	EntryPatch,
	LinkKey,
	LinkPairsState,
	ScreenKey,
	ScreenPairKey,
	TagID,
} from "../types";
import { removeEntry, setEntry } from "./entries";
import {
	registerBoundsScreen,
	screenBelongsToScope,
	unregisterBoundsScreen,
} from "./screen-graph";
import { boundaryRegistry, boundsScreens, pairs } from "./state";

type MeasurementRequest = {
	type: "source" | "destination";
	pairKey: ScreenPairKey;
};

type RegisterScreenParams = {
	screenKey: ScreenKey;
	parentScreenKey?: ScreenKey;
	animationProgress: SharedValue<number>;
	pendingLifecycleStartBlockCount: SharedValue<number>;
};

type RegisterBoundaryParams = {
	boundTag: BoundTag;
	screenKey: ScreenKey;
	entry: EntryPatch;
};

type RequestBoundaryMeasurementsParams = {
	pairKey: ScreenPairKey;
	tag: TagID;
	destination: boolean;
	refresh: boolean;
};

const getRequestedLinkKey = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	tag: TagID,
): LinkKey => {
	"worklet";
	const requestedLinkKey = getLinkKeyFromTag(tag);
	const group = getGroupKeyFromTag(tag);
	return group
		? (state[pairKey]?.groups[group]?.activeId ?? requestedLinkKey)
		: requestedLinkKey;
};

const getConcreteTag = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	tag: TagID,
): TagID => {
	"worklet";
	const group = getGroupKeyFromTag(tag);
	const linkKey = getRequestedLinkKey(state, pairKey, tag);
	return group ? `${group}:${linkKey}` : linkKey;
};

const hasRegisteredDestination = (
	pairKey: ScreenPairKey,
	tag: TagID,
): boolean => {
	"worklet";
	const destinationRoot = getDestinationScreenKeyFromPairKey(pairKey);
	if (!destinationRoot) return false;

	const screens = boundaryRegistry.get()[tag]?.screens;
	for (const screenKey in screens) {
		if (screenBelongsToScope(screenKey, destinationRoot)) return true;
	}

	return false;
};

const hasRegisteredSource = (pairKey: ScreenPairKey, tag: TagID): boolean => {
	"worklet";
	const sourceRoot = getSourceScreenKeyFromPairKey(pairKey);
	const screens = boundaryRegistry.get()[tag]?.screens;
	for (const screenKey in screens) {
		if (screenBelongsToScope(screenKey, sourceRoot)) return true;
	}

	return false;
};

const claimDestinationBlock = (pairKey: ScreenPairKey, tag: TagID) => {
	"worklet";
	const state = pairs.get();
	const linkKey = getRequestedLinkKey(state, pairKey, tag);
	const pair = state[pairKey];
	if (
		!pair?.destinationRequests?.[linkKey] ||
		pair.blockedDestinations?.[linkKey]
	) {
		return;
	}

	const concreteTag = getConcreteTag(state, pairKey, tag);
	if (
		!hasRegisteredSource(pairKey, concreteTag) ||
		!hasRegisteredDestination(pairKey, concreteTag)
	) {
		return;
	}

	const destinationRoot = getDestinationScreenKeyFromPairKey(pairKey);
	const destinationScreen = boundsScreens.get()[destinationRoot];
	if (!destinationScreen || destinationScreen.animationProgress.get() > 0) {
		return;
	}

	destinationScreen.pendingLifecycleStartBlockCount.modify(
		<T extends number>(count: T): T => {
			"worklet";
			return (count + 1) as T;
		},
	);

	pairs.modify(<T extends LinkPairsState>(current: T): T => {
		"worklet";
		const currentPair = current[pairKey];
		if (!currentPair) return current;
		if (!currentPair.blockedDestinations) {
			currentPair.blockedDestinations = {};
		}
		currentPair.blockedDestinations[linkKey] = true;
		return current;
	});
};

const releaseDestinationBlock = (pairKey: ScreenPairKey, linkKey: LinkKey) => {
	"worklet";
	const pair = pairs.get()[pairKey];
	if (!pair?.blockedDestinations?.[linkKey]) return;

	const destinationRoot = getDestinationScreenKeyFromPairKey(pairKey);
	const destinationScreen = boundsScreens.get()[destinationRoot];
	destinationScreen?.pendingLifecycleStartBlockCount.modify(
		<T extends number>(count: T): T => {
			"worklet";
			return Math.max(0, count - 1) as T;
		},
	);

	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		delete state[pairKey]?.blockedDestinations?.[linkKey];
		return state;
	});
};

export function registerScreen(params: RegisterScreenParams) {
	"worklet";
	const node: BoundsScreenNode = {
		parentScreenKey: params.parentScreenKey,
		animationProgress: params.animationProgress,
		pendingLifecycleStartBlockCount: params.pendingLifecycleStartBlockCount,
	};
	registerBoundsScreen(params.screenKey, node);

	const state = pairs.get();
	for (const pairKey in state) {
		const requests = state[pairKey]?.destinationRequests;
		for (const linkKey in requests) {
			claimDestinationBlock(pairKey, linkKey);
		}
	}
}

export function unregisterScreen(screenKey: ScreenKey) {
	"worklet";
	unregisterBoundsScreen(screenKey);
}

export function registerBoundary({
	boundTag,
	screenKey,
	entry,
}: RegisterBoundaryParams) {
	"worklet";
	setEntry(boundTag.tag, screenKey, entry);

	const state = pairs.get();
	for (const pairKey in state) {
		const linkKey = getRequestedLinkKey(state, pairKey, boundTag.tag);
		if (state[pairKey]?.destinationRequests?.[linkKey]) {
			claimDestinationBlock(pairKey, boundTag.tag);
		}
	}
}

export function unregisterBoundary(boundTag: BoundTag, screenKey: ScreenKey) {
	"worklet";
	removeEntry(boundTag.tag, screenKey);

	const state = pairs.get();
	for (const pairKey in state) {
		const concreteTag = getConcreteTag(state, pairKey, boundTag.tag);
		const type =
			screenBelongsToScope(screenKey, getSourceScreenKeyFromPairKey(pairKey)) &&
			!hasRegisteredSource(pairKey, concreteTag)
				? "source"
				: screenBelongsToScope(
							screenKey,
							getDestinationScreenKeyFromPairKey(pairKey),
						) && !hasRegisteredDestination(pairKey, concreteTag)
					? "destination"
					: null;
		if (!type) continue;

		abandonBoundaryMeasurement({
			type,
			pairKey,
			tag: getRequestedLinkKey(state, pairKey, boundTag.tag),
		});
	}
}

export function requestBoundaryMeasurements({
	pairKey,
	tag,
	destination,
	refresh,
}: RequestBoundaryMeasurementsParams) {
	"worklet";
	const requestedLinkKey = getLinkKeyFromTag(tag);
	const group = getGroupKeyFromTag(tag);
	const previousActiveId = group
		? pairs.get()[pairKey]?.groups[group]?.activeId
		: undefined;

	if (previousActiveId && previousActiveId !== requestedLinkKey) {
		releaseDestinationBlock(pairKey, previousActiveId);
	}

	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		const groups = ensurePairGroups(state, pairKey);
		if (group && groups[group]?.activeId !== requestedLinkKey) {
			groups[group] = {
				activeId: requestedLinkKey,
				initialId: groups[group]?.initialId ?? requestedLinkKey,
			};
			if (previousActiveId) {
				delete state[pairKey]?.sourceRequests?.[previousActiveId];
				delete state[pairKey]?.destinationRequests?.[previousActiveId];
			}
		}

		const linkKey = getRequestedLinkKey(state, pairKey, tag);
		const pair = state[pairKey];
		const link = ensurePairLinks(state, pairKey)[linkKey];
		const refreshing = !!pair?.refreshingLinks?.[linkKey];
		const startsRefresh = refresh && !refreshing;

		if (!pair.refreshingLinks) pair.refreshingLinks = {};
		if (refresh) {
			pair.refreshingLinks[linkKey] = true;
		} else {
			delete pair.refreshingLinks[linkKey];
		}

		if (!link?.source || startsRefresh) {
			ensurePairSourceRequests(state, pairKey)[linkKey] = true;
		}

		if (destination) {
			if (group) {
				if (!pair.destinationGroupDemands) pair.destinationGroupDemands = {};
				pair.destinationGroupDemands[group] = true;
			} else {
				if (!pair.destinationLinkDemands) pair.destinationLinkDemands = {};
				pair.destinationLinkDemands[linkKey] = true;
			}

			if (!link?.destination || startsRefresh) {
				ensurePairDestinationRequests(state, pairKey)[linkKey] = true;
			}
		}

		return state;
	});

	if (destination) claimDestinationBlock(pairKey, tag);
}

export function getBoundaryMeasurementRequest(
	tag: TagID,
	screenKey: ScreenKey,
	state: LinkPairsState = pairs.get(),
): MeasurementRequest | null {
	"worklet";
	const linkKey = getLinkKeyFromTag(tag);
	const group = getGroupKeyFromTag(tag);
	let match: MeasurementRequest | null = null;

	for (const pairKey in state) {
		const pair = state[pairKey];
		if (group && pair?.groups[group]?.activeId !== linkKey) continue;

		const sourceRoot = getSourceScreenKeyFromPairKey(pairKey);
		if (
			pair?.sourceRequests?.[linkKey] &&
			screenBelongsToScope(screenKey, sourceRoot)
		) {
			match = { type: "source", pairKey };
		}

		const destinationRoot = getDestinationScreenKeyFromPairKey(pairKey);
		if (
			pair?.destinationRequests?.[linkKey] &&
			destinationRoot &&
			screenBelongsToScope(screenKey, destinationRoot)
		) {
			match = { type: "destination", pairKey };
		}
	}

	return match;
}

export function completeBoundaryMeasurement(
	target: MeasurementRequest,
	tag: TagID,
) {
	"worklet";
	const linkKey = getLinkKeyFromTag(tag);
	const link = pairs.get()[target.pairKey]?.links[linkKey];
	if (!link?.source || !link.destination) return;
	releaseDestinationBlock(target.pairKey, linkKey);
}

export function abandonBoundaryMeasurement(
	params: MeasurementRequest & { tag: TagID },
) {
	"worklet";
	const linkKey = getLinkKeyFromTag(params.tag);
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		if (params.type === "source") {
			delete state[params.pairKey]?.sourceRequests?.[linkKey];
		} else {
			delete state[params.pairKey]?.destinationRequests?.[linkKey];
		}
		return state;
	});

	releaseDestinationBlock(params.pairKey, linkKey);
}
