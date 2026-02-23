import { makeMutable } from "react-native-reanimated";
import type {
	GroupState,
	PresenceState,
	TagID,
	TagLinkIndex,
	TagState,
} from "../types";

export const createEmptyLinkIndex = (): TagLinkIndex => ({
	latestPendingIndex: -1,
	pendingIndices: [],
	pendingBySourceKey: {},
	anyBySourceKey: {},
	completedBySourceKey: {},
	completedByDestinationKey: {},
});

export const createEmptyTagState = (): TagState => ({
	snapshots: {},
	linkStack: [],
	linkIndex: createEmptyLinkIndex(),
});

export const registry = makeMutable<Record<TagID, TagState>>({});
export const presence = makeMutable<PresenceState>({});
export const groups = makeMutable<Record<string, GroupState>>({});

const RESOLVER_LOG_PREFIX = "[bounds:resolver]";
const ENABLE_RESOLVER_DEBUG_LOGS = false;
const CLEAR_LOG_PREFIX = "[bounds:clear]";
const ENABLE_CLEAR_DEBUG_LOGS = false;
const SIZE_LOG_PREFIX = "[bounds:size]";
const ENABLE_SIZE_DEBUG_LOGS = false;

type BoundStoreSize = {
	tags: number;
	snapshots: number;
	links: number;
	pendingLinks: number;
	completedLinks: number;
	presenceTags: number;
	presenceEntries: number;
	presenceCount: number;
	groups: number;
};

export function debugResolverLog(message: string) {
	"worklet";
	if (!ENABLE_RESOLVER_DEBUG_LOGS) return;
	console.warn(`${RESOLVER_LOG_PREFIX} ${message}`);
}

export function debugClearLog(message: string) {
	"worklet";
	if (!ENABLE_CLEAR_DEBUG_LOGS) return;
	console.warn(`${CLEAR_LOG_PREFIX} ${message}`);
}

const collectBoundStoreSize = (): BoundStoreSize => {
	"worklet";
	const currentRegistry = registry.value;
	const currentPresence = presence.value;
	const currentGroups = groups.value;

	let tags = 0;
	let snapshots = 0;
	let links = 0;
	let pendingLinks = 0;
	let completedLinks = 0;

	for (const tag in currentRegistry) {
		tags++;
		const tagState = currentRegistry[tag];
		for (const _snapshotKey in tagState.snapshots) {
			snapshots++;
		}
		for (let i = 0; i < tagState.linkStack.length; i++) {
			links++;
			if (tagState.linkStack[i].destination === null) {
				pendingLinks++;
			} else {
				completedLinks++;
			}
		}
	}

	let presenceTags = 0;
	let presenceEntries = 0;
	let presenceCount = 0;
	for (const tag in currentPresence) {
		presenceTags++;
		const entries = currentPresence[tag];
		for (const screenKey in entries) {
			presenceEntries++;
			presenceCount += entries[screenKey].count ?? 0;
		}
	}

	let groupsCount = 0;
	for (const _group in currentGroups) {
		groupsCount++;
	}

	return {
		tags,
		snapshots,
		links,
		pendingLinks,
		completedLinks,
		presenceTags,
		presenceEntries,
		presenceCount,
		groups: groupsCount,
	};
};

export function debugStoreSizeLog(action: string) {
	"worklet";
	if (!ENABLE_SIZE_DEBUG_LOGS) return;
	const size = collectBoundStoreSize();
	console.warn(
		`${SIZE_LOG_PREFIX} ${action} tags=${size.tags} snapshots=${size.snapshots} links=${size.links} pending=${size.pendingLinks} completed=${size.completedLinks} presenceTags=${size.presenceTags} presenceEntries=${size.presenceEntries} presenceCount=${size.presenceCount} groups=${size.groups}`,
	);
}
