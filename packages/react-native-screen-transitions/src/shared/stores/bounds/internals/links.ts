import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import {
	createGroupTag,
	createPendingPairKey,
	ensurePairGroups,
	ensurePairLinks,
	getGroupKeyFromTag,
	getLinkKeyFromTag,
	getActiveGroupId as getPairActiveGroupId,
	getDestination as getPairDestination,
	getLink as getPairLink,
	getSource as getPairSource,
	getSourceScreenKeyFromPairKey,
	removePairLink,
} from "../helpers/link-pairs.helpers";
import type {
	GroupKey,
	LinkKey,
	LinkPairsState,
	ScreenKey,
	ScreenPairKey,
	TagID,
	TagLink,
} from "../types";
import { pairs } from "./state";

const toLinkKey = (tag: TagID): LinkKey => {
	"worklet";
	return getLinkKeyFromTag(tag);
};

const createLinkSide = (
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps,
) => {
	"worklet";
	return {
		screenKey,
		bounds,
		styles,
	};
};

const writePairLink = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
	link: TagLink,
) => {
	"worklet";
	ensurePairLinks(state, pairKey)[linkKey] = link;
};

const writeGroup = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	group: GroupKey,
	activeId: LinkKey,
	initialId?: LinkKey,
) => {
	"worklet";
	const previousInitialId = state[pairKey]?.groups?.[group]?.initialId;

	ensurePairGroups(state, pairKey)[group] = {
		activeId,
		initialId: previousInitialId ?? initialId ?? activeId,
	};
};

const writeDestination = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps,
	group?: GroupKey,
) => {
	"worklet";
	const link = getPairLink(state, pairKey, linkKey);
	if (!link) return;

	const destination = createLinkSide(screenKey, bounds, styles);

	link.group = group ?? link.group;
	link.destination = destination;
	link.initialDestination ??= destination;

	writePairLink(state, pairKey, linkKey, link);

	if (link.group) {
		writeGroup(state, pairKey, link.group, linkKey);
	}
};

const promotePendingSource = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
) => {
	"worklet";
	if (getPairLink(state, pairKey, linkKey)) return;

	const sourceScreenKey = getSourceScreenKeyFromPairKey(pairKey);
	const pendingPairKey = createPendingPairKey(sourceScreenKey);
	if (pendingPairKey === pairKey) return;

	const pendingLink = getPairLink(state, pendingPairKey, linkKey);
	if (!pendingLink) return;

	writePairLink(state, pairKey, linkKey, pendingLink);

	if (pendingLink.group) {
		const pendingGroupState =
			state[pendingPairKey]?.groups?.[pendingLink.group];

		if (pendingGroupState) {
			writeGroup(
				state,
				pairKey,
				pendingLink.group,
				pendingGroupState.activeId,
				pendingGroupState.initialId,
			);
		}
	}

	removePairLink(state, pendingPairKey, linkKey);
};

function setSource(
	pairKey: ScreenPairKey,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	group?: GroupKey,
) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		const linkKey = toLinkKey(tag);
		const source = createLinkSide(screenKey, bounds, styles);

		const pairLinks = ensurePairLinks(state, pairKey);

		const existingLink = pairLinks[linkKey];
		const link =
			existingLink ??
			({
				group,
				source,
				destination: null,
				initialSource: source,
			} satisfies TagLink);

		link.group = group ?? link.group;
		link.source = source;
		link.initialSource ??= source;

		pairLinks[linkKey] = link;

		const pendingPairKey = createPendingPairKey(screenKey);
		if (pendingPairKey !== pairKey) {
			removePairLink(state, pendingPairKey, linkKey);
		}

		return state;
	});
}

function setDestination(
	pairKey: ScreenPairKey,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	group?: GroupKey,
) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		const linkKey = toLinkKey(tag);
		promotePendingSource(state, pairKey, linkKey);
		writeDestination(state, pairKey, linkKey, screenKey, bounds, styles, group);

		return state;
	});
}

function setActiveGroupId(pairKey: ScreenPairKey, group: GroupKey, tag: TagID) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		writeGroup(state, pairKey, group, toLinkKey(tag));
		return state;
	});
}

function getActiveGroupId(
	pairKey: ScreenPairKey,
	group: GroupKey,
): LinkKey | null {
	"worklet";
	return getPairActiveGroupId(pairs.get(), pairKey, group);
}

function getLink(pairKey: ScreenPairKey, tag: TagID): TagLink | null {
	"worklet";
	return getPairLink(pairs.get(), pairKey, toLinkKey(tag));
}

const isCompletedLink = (link: TagLink | null): link is TagLink => {
	"worklet";
	return !!link?.destination;
};

function getResolvedLink(
	pairKey: ScreenPairKey,
	tag: TagID,
): { tag: TagID; link: TagLink | null } {
	"worklet";
	const state = pairs.get();
	const linkKey = toLinkKey(tag);
	const group = getGroupKeyFromTag(tag);
	const requestedLink = getPairLink(state, pairKey, linkKey);

	// Group active ids can update before the new member has a full source/destination
	// link, so unresolved grouped links fall back to the initial id's measurements.
	if (!group || isCompletedLink(requestedLink)) {
		return {
			tag,
			link: requestedLink,
		};
	}

	const initialId = state[pairKey]?.groups?.[group]?.initialId;
	if (initialId) {
		const initialLink = getPairLink(state, pairKey, initialId);
		if (isCompletedLink(initialLink)) {
			return {
				tag: createGroupTag(group, initialId),
				link: initialLink,
			};
		}
	}

	return {
		tag,
		link: requestedLink,
	};
}

function getSource(
	pairKey: ScreenPairKey,
	tag: TagID,
): TagLink["source"] | null {
	"worklet";
	return getPairSource(pairs.get(), pairKey, toLinkKey(tag));
}

function getDestination(
	pairKey: ScreenPairKey,
	tag: TagID,
): TagLink["destination"] | null {
	"worklet";
	return getPairDestination(pairs.get(), pairKey, toLinkKey(tag));
}

export {
	getActiveGroupId,
	getDestination,
	getLink,
	getResolvedLink,
	getSource,
	setActiveGroupId,
	setDestination,
	setSource,
};
