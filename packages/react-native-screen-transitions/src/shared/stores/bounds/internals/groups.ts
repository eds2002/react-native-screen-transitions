import {
	createGroupTag,
	getGroupName,
	parseGroupTag,
} from "../helpers/groups.helpers";
import type { ScreenKey, TagID, TagLink } from "../types";
import { getMatchedLink } from "./links";
import { type GroupsState, groups } from "./state";

type ResolveGroupLinkParams = {
	tag: TagID;
	screenKey?: ScreenKey;
};

type ResolvedGroupLink = {
	tag: TagID;
	link: TagLink | null;
};

function setGroupActiveId(group: string, id: string) {
	"worklet";
	groups.modify(<T extends GroupsState>(state: T): T => {
		"worklet";
		const mutableState = state as GroupsState;
		const previous = mutableState[group];
		mutableState[group] = {
			activeId: id,
			initialId: previous?.initialId,
		};
		return state;
	});
}

function setGroupInitialId(group: string, id: string) {
	"worklet";
	groups.modify(<T extends GroupsState>(state: T): T => {
		"worklet";
		const mutableState = state as GroupsState;
		mutableState[group] = {
			activeId: id,
			initialId: id,
		};
		return state;
	});
}

function getGroupActiveId(tagOrGroup: string): string | null {
	"worklet";
	return groups.get()[getGroupName(tagOrGroup)]?.activeId ?? null;
}

function getGroupInitialId(tagOrGroup: string): string | null {
	"worklet";
	return groups.get()[getGroupName(tagOrGroup)]?.initialId ?? null;
}

// Selects the current active group member for this tag.
function resolveGroupLink({
	tag,
	screenKey,
}: ResolveGroupLinkParams): ResolvedGroupLink {
	"worklet";
	const groupTag = parseGroupTag(tag);

	if (!groupTag) {
		return {
			tag,
			link: getMatchedLink(tag, screenKey),
		};
	}

	const requestedLink = getMatchedLink(tag, screenKey);
	if (requestedLink) {
		return {
			tag,
			link: requestedLink,
		};
	}

	const activeId = getGroupActiveId(groupTag.group);
	if (activeId) {
		const activeTag = createGroupTag(groupTag.group, activeId);
		const activeLink = getMatchedLink(activeTag, screenKey);
		if (activeLink) {
			return {
				tag: activeTag,
				link: activeLink,
			};
		}
	}

	const initialId = getGroupInitialId(groupTag.group);
	if (initialId) {
		const initialTag = createGroupTag(groupTag.group, initialId);
		const initialLink = getMatchedLink(initialTag, screenKey);
		if (initialLink) {
			return {
				tag: initialTag,
				link: initialLink,
			};
		}
	}

	return {
		tag,
		link: null,
	};
}

export {
	getGroupActiveId,
	getGroupInitialId,
	resolveGroupLink,
	setGroupActiveId,
	setGroupInitialId,
};
