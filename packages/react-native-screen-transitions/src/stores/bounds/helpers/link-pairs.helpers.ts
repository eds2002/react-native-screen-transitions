import type {
	BoundTag,
	GroupKey,
	LinkGroupState,
	LinkKey,
	LinkPairState,
	LinkPairsState,
	ScreenIdentifier,
	ScreenPairKey,
	TagLink,
} from "../types";

const PAIR_SEPARATOR = "<>";

export const createScreenPairKey = (
	sourceScreenKey: ScreenIdentifier["screenKey"],
	destinationScreenKey: ScreenIdentifier["screenKey"] | "",
): ScreenPairKey => {
	"worklet";
	return `${sourceScreenKey}${PAIR_SEPARATOR}${destinationScreenKey}`;
};

export const createPendingPairKey = (
	sourceScreenKey: ScreenIdentifier["screenKey"],
): ScreenPairKey => {
	"worklet";
	return createScreenPairKey(sourceScreenKey, "");
};

export const getSourceScreenKeyFromPairKey = (
	pairKey: ScreenPairKey,
): ScreenIdentifier["screenKey"] => {
	"worklet";
	const separatorIndex = pairKey.indexOf(PAIR_SEPARATOR);
	if (separatorIndex === -1) return pairKey;
	return pairKey.slice(0, separatorIndex);
};

export const getDestinationScreenKeyFromPairKey = (
	pairKey: ScreenPairKey,
): ScreenIdentifier["screenKey"] | "" => {
	"worklet";
	const separatorIndex = pairKey.indexOf(PAIR_SEPARATOR);
	if (separatorIndex === -1) return "";
	return pairKey.slice(separatorIndex + PAIR_SEPARATOR.length);
};

export const isScreenPairKeyForScreen = (
	pairKey: ScreenPairKey,
	screenKey: ScreenIdentifier["screenKey"],
): boolean => {
	"worklet";
	return (
		pairKey === createPendingPairKey(screenKey) ||
		pairKey.startsWith(`${screenKey}${PAIR_SEPARATOR}`) ||
		pairKey.endsWith(`${PAIR_SEPARATOR}${screenKey}`)
	);
};

export const getLinkKeyFromTag = (tag: string): LinkKey => {
	"worklet";
	const separatorIndex = tag.indexOf(":");
	if (separatorIndex === -1) return tag;
	return tag.slice(separatorIndex + 1);
};

export const getGroupKeyFromTag = (tag: string): GroupKey | null => {
	"worklet";
	const separatorIndex = tag.indexOf(":");
	if (separatorIndex === -1) return null;
	return tag.slice(0, separatorIndex);
};

export const createGroupTag = (group: GroupKey, linkKey: LinkKey): string => {
	"worklet";
	return `${group}:${linkKey}`;
};

/**
 * Builds the {@link BoundTag} identity for a boundary. The combined `tag` is
 * group-prefixed only when a group is present, matching how links are keyed.
 */
export const createBoundTag = (
	linkKey: LinkKey,
	group?: GroupKey,
): BoundTag => {
	"worklet";
	return {
		tag: group ? createGroupTag(group, linkKey) : linkKey,
		linkKey,
		group,
	};
};

const ensurePairState = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
): LinkPairState => {
	"worklet";
	if (!state[pairKey]) {
		state[pairKey] = {
			links: {},
			groups: {},
		};
	}
	if (!state[pairKey].groups) {
		state[pairKey].groups = {};
	}
	return state[pairKey];
};

export const ensurePairLinks = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
): Record<LinkKey, TagLink> => {
	"worklet";
	return ensurePairState(state, pairKey).links;
};

export const ensurePairGroups = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
): Record<GroupKey, LinkGroupState> => {
	"worklet";
	return ensurePairState(state, pairKey).groups;
};

export const ensurePairSourceRequests = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
): Record<LinkKey, true> => {
	"worklet";
	const pair = ensurePairState(state, pairKey);
	if (!pair.sourceRequests) {
		pair.sourceRequests = {};
	}
	return pair.sourceRequests;
};

export const getPairLink = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
): TagLink | null => {
	"worklet";
	return state[pairKey]?.links[linkKey] ?? null;
};

export const getPairSource = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
): TagLink["source"] | null => {
	"worklet";
	return getPairLink(state, pairKey, linkKey)?.source ?? null;
};

export const getPairDestination = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
): TagLink["destination"] | null => {
	"worklet";
	return getPairLink(state, pairKey, linkKey)?.destination ?? null;
};

/**
 * Whether a link is its group's active member in a pair: the member the transition shows. A group
 * with no active member yet has none, so no member acts for it.
 */
export const isActiveGroupMember = (
	state: LinkPairsState | undefined,
	pairKey: ScreenPairKey,
	group: GroupKey,
	linkKey: LinkKey,
): boolean => {
	"worklet";
	return state?.[pairKey]?.groups?.[group]?.activeId === linkKey;
};

export const getPairActiveGroupId = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	group: GroupKey,
): LinkKey | null => {
	"worklet";
	return state[pairKey]?.groups?.[group]?.activeId ?? null;
};
