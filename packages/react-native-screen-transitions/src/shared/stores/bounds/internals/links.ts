import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import {
	createGroupTag,
	ensurePairGroups,
	ensurePairLinks,
	getGroupKeyFromTag,
	getLinkKeyFromTag,
	getActiveGroupId as getPairActiveGroupId,
	getDestination as getPairDestination,
	getLink as getPairLink,
	getSource as getPairSource,
} from "../helpers/link-pairs.helpers";
import type {
	BoundsPortalAttachTarget,
	GroupKey,
	LinkKey,
	LinkPairsState,
	ScreenKey,
	ScreenPairKey,
	SourceHostRef,
	SourceTagLinkSide,
	TagID,
	TagLink,
} from "../types";
import { pairs } from "./state";

const syncLinkStatus = (link: TagLink) => {
	"worklet";
	link.status = link.source
		? link.destination
			? "complete"
			: "destination-incomplete"
		: "source-incomplete";
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
	const existingLink = getPairLink(state, pairKey, linkKey);

	const destination = createLinkSide(screenKey, bounds, styles);
	const link =
		existingLink ??
		({
			group,
			status: "source-incomplete",
			source: null,
			destination,
			initialDestination: destination,
		} satisfies TagLink);

	link.group = group ?? link.group;
	link.destination = destination;
	link.initialDestination ??= destination;
	syncLinkStatus(link);

	writePairLink(state, pairKey, linkKey, link);

	if (link.group) {
		writeGroup(state, pairKey, link.group, linkKey);
	}
};

function setSource(
	pairKey: ScreenPairKey,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	group?: GroupKey,
	portalAttachTarget?: BoundsPortalAttachTarget,
	sourceHost?: SourceHostRef,
) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		const linkKey = getLinkKeyFromTag(tag);

		const pairLinks = ensurePairLinks(state, pairKey);

		const existingLink = pairLinks[linkKey];

		// Refresh paths may re-measure the source without portal context;
		// keep the previously recorded host in that case.
		const source: SourceTagLinkSide = {
			...createLinkSide(screenKey, bounds, styles),
			portalAttachTarget:
				portalAttachTarget ?? existingLink?.source?.portalAttachTarget,
			sourceHost: sourceHost ?? existingLink?.source?.sourceHost,
		};
		const link =
			existingLink ??
			({
				group,
				status: "destination-incomplete",
				source,
				destination: null,
				initialSource: source,
			} satisfies TagLink);

		link.group = group ?? link.group;
		link.source = source;
		link.initialSource ??= source;
		syncLinkStatus(link);

		pairLinks[linkKey] = link;

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
		const linkKey = getLinkKeyFromTag(tag);
		writeDestination(state, pairKey, linkKey, screenKey, bounds, styles, group);

		return state;
	});
}

function setActiveGroupId(pairKey: ScreenPairKey, group: GroupKey, tag: TagID) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		writeGroup(state, pairKey, group, getLinkKeyFromTag(tag));
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
	return getPairLink(pairs.get(), pairKey, getLinkKeyFromTag(tag));
}

const hasSourceLink = (
	link: TagLink | null,
): link is TagLink & { source: NonNullable<TagLink["source"]> } => {
	"worklet";
	return !!link?.source;
};

function getResolvedLink(
	pairKey: ScreenPairKey,
	tag: TagID,
): { tag: TagID; link: TagLink | null } {
	"worklet";
	const state = pairs.get();
	const linkKey = getLinkKeyFromTag(tag);
	const group = getGroupKeyFromTag(tag);
	const link = getPairLink(state, pairKey, linkKey);

	// Group active ids can update before the new member has a full source/destination
	// link. As soon as the requested member has source bounds, prefer it; only
	// fall back while the requested member has no source yet.
	if (!group || hasSourceLink(link)) {
		return {
			tag,
			link,
		};
	}

	const initialId = state[pairKey]?.groups?.[group]?.initialId;
	if (initialId) {
		const initialLink = getPairLink(state, pairKey, initialId);

		if (hasSourceLink(initialLink)) {
			return {
				tag: createGroupTag(group, initialId),
				link: initialLink,
			};
		}
	}

	return {
		tag,
		link,
	};
}

function getSource(
	pairKey: ScreenPairKey,
	tag: TagID,
): TagLink["source"] | null {
	"worklet";
	return getPairSource(pairs.get(), pairKey, getLinkKeyFromTag(tag));
}

function getDestination(
	pairKey: ScreenPairKey,
	tag: TagID,
): TagLink["destination"] | null {
	"worklet";
	return getPairDestination(pairs.get(), pairKey, getLinkKeyFromTag(tag));
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
