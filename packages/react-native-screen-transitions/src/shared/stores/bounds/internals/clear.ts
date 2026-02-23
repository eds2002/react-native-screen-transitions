import { matchesScreenKey } from "../helpers/matching";
import type { ScreenKey, SnapshotEntry, TagLink, TagState } from "../types";
import { rebuildLinkIndexForTagState } from "./registry";
import { debugClearLog, debugStoreSizeLog, presence, registry } from "./state";

const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};

const countRegistryMatches = (
	screenKey: ScreenKey,
	matchByAncestor: boolean,
): { snapshots: number; links: number } => {
	"worklet";
	const currentRegistry = registry.value;
	let snapshots = 0;
	let links = 0;

	for (const tag in currentRegistry) {
		const tagState = currentRegistry[tag];

		for (const snapshotKey in tagState.snapshots) {
			const snapshot = tagState.snapshots[snapshotKey];
			const matched = matchByAncestor
				? snapshotKey === screenKey ||
					(snapshot.ancestorKeys?.includes(screenKey) ?? false)
				: snapshotKey === screenKey;
			if (matched) snapshots++;
		}

		for (let i = 0; i < tagState.linkStack.length; i++) {
			const link = tagState.linkStack[i];
			if (
				matchesScreenKey(link.source, screenKey) ||
				matchesScreenKey(link.destination, screenKey)
			) {
				links++;
			}
		}
	}

	return { snapshots, links };
};

const countPresenceMatches = (
	screenKey: ScreenKey,
	matchByAncestor: boolean,
): number => {
	"worklet";
	const currentPresence = presence.value;
	let matches = 0;

	for (const tag in currentPresence) {
		const tagEntries = currentPresence[tag];
		for (const entryScreenKey in tagEntries) {
			const entry = tagEntries[entryScreenKey];
			const matched = matchByAncestor
				? entryScreenKey === screenKey ||
					(entry.ancestorKeys?.includes(screenKey) ?? false)
				: entryScreenKey === screenKey;
			if (matched) matches++;
		}
	}

	return matches;
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
	const beforeMatches = countRegistryMatches(screenKey, false);
	const beforePresenceMatches = countPresenceMatches(screenKey, false);

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

	const afterMatches = countRegistryMatches(screenKey, false);
	const afterPresenceMatches = countPresenceMatches(screenKey, false);

	debugClearLog(
		`clear(${screenKey}) snapshots=${beforeMatches.snapshots}->${afterMatches.snapshots} links=${beforeMatches.links}->${afterMatches.links} presence=${beforePresenceMatches}->${afterPresenceMatches}`,
	);
	debugStoreSizeLog(`clear(${screenKey})`);
}

function clearByAncestor(ancestorKey: ScreenKey) {
	"worklet";
	const beforeMatches = countRegistryMatches(ancestorKey, true);
	const beforePresenceMatches = countPresenceMatches(ancestorKey, true);

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

	const afterMatches = countRegistryMatches(ancestorKey, true);
	const afterPresenceMatches = countPresenceMatches(ancestorKey, true);

	debugClearLog(
		`clearByAncestor(${ancestorKey}) snapshots=${beforeMatches.snapshots}->${afterMatches.snapshots} links=${beforeMatches.links}->${afterMatches.links} presence=${beforePresenceMatches}->${afterPresenceMatches}`,
	);
	debugStoreSizeLog(`clearByAncestor(${ancestorKey})`);
}

export { clear, clearByAncestor };
