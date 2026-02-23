import { matchesScreenKey } from "../helpers/matching";
import type { ScreenKey, SnapshotEntry, TagLink, TagState } from "../types";
import { rebuildLinkIndexForTagState } from "./registry";
import { presence, registry } from "./state";

const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};

const clearRegistry = (params: {
	shouldRemoveSnapshot: (
		screenKey: ScreenKey,
		snapshot: SnapshotEntry,
	) => boolean;
	shouldRemoveLink: (link: TagLink) => boolean;
}) => {
	"worklet";
	const { shouldRemoveSnapshot, shouldRemoveLink } = params;

	const currentRegistry = registry.value;
	let nextRegistry: Record<string, TagState> | null = null;

	for (const tag in currentRegistry) {
		const tagState = currentRegistry[tag];
		let snapshotsChanged = false;
		const nextSnapshots: Record<string, SnapshotEntry> = {};

		for (const snapshotKey in tagState.snapshots) {
			const snapshot = tagState.snapshots[snapshotKey];
			if (shouldRemoveSnapshot(snapshotKey, snapshot)) {
				snapshotsChanged = true;
				continue;
			}
			nextSnapshots[snapshotKey] = snapshot;
		}

		let linksChanged = false;
		const nextLinkStack: TagLink[] = [];
		for (let i = 0; i < tagState.linkStack.length; i++) {
			const link = tagState.linkStack[i];
			if (shouldRemoveLink(link)) {
				linksChanged = true;
				continue;
			}
			nextLinkStack.push(link);
		}

		if (!snapshotsChanged && !linksChanged) {
			continue;
		}

		if (!nextRegistry) {
			nextRegistry = { ...currentRegistry };
		}

		if (!hasAnyKeys(nextSnapshots) && nextLinkStack.length === 0) {
			delete nextRegistry[tag];
			continue;
		}

		const nextTagState: TagState = {
			snapshots: snapshotsChanged ? nextSnapshots : tagState.snapshots,
			linkStack: linksChanged ? nextLinkStack : tagState.linkStack,
			linkIndex: tagState.linkIndex,
		};

		if (linksChanged) {
			nextTagState.linkIndex = {
				latestPendingIndex: -1,
				pendingIndices: [],
				pendingBySourceKey: {},
				anyBySourceKey: {},
				completedBySourceKey: {},
				completedByDestinationKey: {},
			};
			rebuildLinkIndexForTagState(nextTagState);
		}

		nextRegistry[tag] = nextTagState;
	}

	if (nextRegistry) {
		registry.value = nextRegistry;
	}
};

const clearPresenceDirect = (screenKey: ScreenKey) => {
	"worklet";
	const currentPresence = presence.value;
	let nextPresence: typeof currentPresence | null = null;

	for (const tag in currentPresence) {
		const tagEntries = currentPresence[tag];
		if (!tagEntries[screenKey]) continue;

		if (!nextPresence) {
			nextPresence = { ...currentPresence };
		}

		const { [screenKey]: _removed, ...remainingForTag } = nextPresence[tag];
		if (!hasAnyKeys(remainingForTag)) {
			delete nextPresence[tag];
		} else {
			nextPresence[tag] = remainingForTag;
		}
	}

	if (nextPresence) {
		presence.value = nextPresence;
	}
};

const clearPresenceByAncestor = (ancestorKey: ScreenKey) => {
	"worklet";
	const currentPresence = presence.value;
	let nextPresence: typeof currentPresence | null = null;

	for (const tag in currentPresence) {
		const tagEntries = currentPresence[tag];
		let tagChanged = false;
		const remainingForTag: Record<string, any> = {};

		for (const entryScreenKey in tagEntries) {
			const entry = tagEntries[entryScreenKey];
			const shouldRemove =
				entryScreenKey === ancestorKey ||
				(entry.ancestorKeys?.includes(ancestorKey) ?? false);

			if (shouldRemove) {
				tagChanged = true;
				continue;
			}

			remainingForTag[entryScreenKey] = entry;
		}

		if (!tagChanged) continue;

		if (!nextPresence) {
			nextPresence = { ...currentPresence };
		}

		if (!hasAnyKeys(remainingForTag)) {
			delete nextPresence[tag];
		} else {
			nextPresence[tag] = remainingForTag;
		}
	}

	if (nextPresence) {
		presence.value = nextPresence;
	}
};

function clear(screenKey: ScreenKey) {
	"worklet";
	clearRegistry({
		shouldRemoveSnapshot: (snapshotKey) => snapshotKey === screenKey,
		shouldRemoveLink: (link) => {
			return (
				matchesScreenKey(link.source, screenKey) ||
				matchesScreenKey(link.destination, screenKey)
			);
		},
	});

	clearPresenceDirect(screenKey);
}

function clearByAncestor(ancestorKey: ScreenKey) {
	"worklet";
	clearRegistry({
		shouldRemoveSnapshot: (snapshotKey, snapshot) => {
			return (
				snapshotKey === ancestorKey ||
				(snapshot.ancestorKeys?.includes(ancestorKey) ?? false)
			);
		},
		shouldRemoveLink: (link) => {
			return (
				matchesScreenKey(link.source, ancestorKey) ||
				matchesScreenKey(link.destination, ancestorKey)
			);
		},
	});

	clearPresenceByAncestor(ancestorKey);
}

export { clear, clearByAncestor };
