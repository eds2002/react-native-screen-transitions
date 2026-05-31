import type {
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

export const ensurePairState = (
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
	state[pairKey].groups ??= {};
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

export const removePairLink = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
) => {
	"worklet";
	const pair = state[pairKey];
	if (!pair) return;

	delete pair.links[linkKey];

	for (const key in pair.links) {
		if (pair.links[key]) return;
	}

	delete state[pairKey];
};

export const getLink = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
): TagLink | null => {
	"worklet";
	return state[pairKey]?.links[linkKey] ?? null;
};

export const getSource = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
): TagLink["source"] | null => {
	"worklet";
	return getLink(state, pairKey, linkKey)?.source ?? null;
};

export const getDestination = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
): TagLink["destination"] | null => {
	"worklet";
	return getLink(state, pairKey, linkKey)?.destination ?? null;
};

export const getActiveGroupId = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	group: GroupKey,
): LinkKey | null => {
	"worklet";
	return state[pairKey]?.groups?.[group]?.activeId ?? null;
};
