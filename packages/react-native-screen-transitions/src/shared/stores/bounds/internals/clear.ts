import { matchesNavigatorKey, matchesScreenKey } from "../helpers/matching";
import type {
	NavigatorKey,
	PresenceEntry,
	PresenceState,
	ScreenKey,
	SnapshotEntry,
	TagLink,
} from "../types";
import { presence, type RegistryState, registry } from "./state";

const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};

type SnapshotPredicate = (
	screenKey: ScreenKey,
	snapshot: SnapshotEntry,
) => boolean;

type LinkPredicate = (link: TagLink) => boolean;

type PresencePredicate = (
	screenKey: ScreenKey,
	entry: PresenceEntry,
) => boolean;

const clearRegistry = (
	shouldClearSnapshot: SnapshotPredicate,
	shouldClearLink: LinkPredicate,
) => {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagState = state[tag];

			for (const snapshotKey in tagState.snapshots) {
				const snapshot = tagState.snapshots[snapshotKey];
				if (shouldClearSnapshot(snapshotKey, snapshot)) {
					delete tagState.snapshots[snapshotKey];
				}
			}

			for (let i = tagState.linkStack.length - 1; i >= 0; i--) {
				const link = tagState.linkStack[i];
				if (shouldClearLink(link)) {
					tagState.linkStack.splice(i, 1);
				}
			}

			if (!hasAnyKeys(tagState.snapshots) && tagState.linkStack.length === 0) {
				delete state[tag];
			}
		}

		return state;
	});
};

const clearPresence = (shouldClearPresence: PresencePredicate) => {
	"worklet";
	presence.modify(<T extends PresenceState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagEntries = state[tag];

			for (const entryScreenKey in tagEntries) {
				const entry = tagEntries[entryScreenKey];
				if (shouldClearPresence(entryScreenKey, entry)) {
					delete tagEntries[entryScreenKey];
				}
			}

			if (!hasAnyKeys(tagEntries)) {
				delete state[tag];
			}
		}

		return state;
	});
};

const performClear = (
	shouldClearSnapshot: SnapshotPredicate,
	shouldClearLink: LinkPredicate,
	shouldClearPresence: PresencePredicate,
) => {
	"worklet";
	clearRegistry(shouldClearSnapshot, shouldClearLink);
	clearPresence(shouldClearPresence);
};

function clear(screenKey: ScreenKey) {
	"worklet";
	performClear(
		(snapshotKey) => snapshotKey === screenKey,
		(link) => {
			return (
				matchesScreenKey(link.source, screenKey) ||
				matchesScreenKey(link.destination, screenKey)
			);
		},
		(entryScreenKey) => entryScreenKey === screenKey,
	);
}

function clearByAncestor(ancestorKey: ScreenKey) {
	"worklet";
	performClear(
		(snapshotKey, snapshot) => {
			return (
				snapshotKey === ancestorKey ||
				(snapshot.ancestorKeys?.includes(ancestorKey) ?? false)
			);
		},
		(link) => {
			return (
				matchesScreenKey(link.source, ancestorKey) ||
				matchesScreenKey(link.destination, ancestorKey)
			);
		},
		(entryScreenKey, entry) => {
			return (
				entryScreenKey === ancestorKey ||
				(entry.ancestorKeys?.includes(ancestorKey) ?? false)
			);
		},
	);
}

function clearByBranch(branchNavigatorKey: NavigatorKey) {
	"worklet";
	if (!branchNavigatorKey) return;

	performClear(
		(_snapshotKey, snapshot) => {
			return (
				snapshot.navigatorKey === branchNavigatorKey ||
				(snapshot.ancestorNavigatorKeys?.includes(branchNavigatorKey) ?? false)
			);
		},
		(link) => {
			return (
				matchesNavigatorKey(link.source, branchNavigatorKey) ||
				matchesNavigatorKey(link.destination, branchNavigatorKey)
			);
		},
		(_entryScreenKey, entry) => {
			return (
				entry.navigatorKey === branchNavigatorKey ||
				(entry.ancestorNavigatorKeys?.includes(branchNavigatorKey) ?? false)
			);
		},
	);
}

export { clear, clearByAncestor, clearByBranch };
