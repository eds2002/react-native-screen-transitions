import { matchesNavigatorKey, matchesScreenKey } from "../helpers/matching";
import type {
	NavigatorKey,
	PresenceState,
	ScreenKey,
	SnapshotEntry,
	TagLink,
} from "../types";
import {
	debugClearLog,
	debugStoreSizeLog,
	presence,
	type RegistryState,
	registry,
} from "./state";

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

const countRegistryMatchesByBranch = (
	branchNavigatorKey: NavigatorKey,
): { snapshots: number; links: number } => {
	"worklet";
	const currentRegistry = registry.value;
	let snapshots = 0;
	let links = 0;

	for (const tag in currentRegistry) {
		const tagState = currentRegistry[tag];

		for (const snapshotKey in tagState.snapshots) {
			const snapshot = tagState.snapshots[snapshotKey];
			const matched =
				snapshot.navigatorKey === branchNavigatorKey ||
				(snapshot.ancestorNavigatorKeys?.includes(branchNavigatorKey) ?? false);
			if (matched) snapshots++;
		}

		for (let i = 0; i < tagState.linkStack.length; i++) {
			const link = tagState.linkStack[i];
			if (
				matchesNavigatorKey(link.source, branchNavigatorKey) ||
				matchesNavigatorKey(link.destination, branchNavigatorKey)
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

const countPresenceMatchesByBranch = (
	branchNavigatorKey: NavigatorKey,
): number => {
	"worklet";
	const currentPresence = presence.value;
	let matches = 0;

	for (const tag in currentPresence) {
		const tagEntries = currentPresence[tag];
		for (const entryScreenKey in tagEntries) {
			const entry = tagEntries[entryScreenKey];
			const matched =
				entry.navigatorKey === branchNavigatorKey ||
				(entry.ancestorNavigatorKeys?.includes(branchNavigatorKey) ?? false);
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

	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagState = state[tag];

			for (const snapshotKey in tagState.snapshots) {
				const snapshot = tagState.snapshots[snapshotKey];
				if (shouldRemoveSnapshot(snapshotKey, snapshot)) {
					delete tagState.snapshots[snapshotKey];
				}
			}

			for (let i = tagState.linkStack.length - 1; i >= 0; i--) {
				const link = tagState.linkStack[i];
				if (shouldRemoveLink(link)) {
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

const clearPresenceDirect = (screenKey: ScreenKey) => {
	"worklet";
	presence.modify(<T extends PresenceState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagEntries = state[tag];
			if (!tagEntries[screenKey]) continue;

			delete tagEntries[screenKey];

			if (!hasAnyKeys(tagEntries)) {
				delete state[tag];
			}
		}
		return state;
	});
};

const clearPresenceByAncestor = (ancestorKey: ScreenKey) => {
	"worklet";
	presence.modify(<T extends PresenceState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagEntries = state[tag];

			for (const entryScreenKey in tagEntries) {
				const entry = tagEntries[entryScreenKey];
				const shouldRemove =
					entryScreenKey === ancestorKey ||
					(entry.ancestorKeys?.includes(ancestorKey) ?? false);
				if (shouldRemove) {
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

const clearPresenceByBranch = (branchNavigatorKey: NavigatorKey) => {
	"worklet";
	presence.modify(<T extends PresenceState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagEntries = state[tag];

			for (const entryScreenKey in tagEntries) {
				const entry = tagEntries[entryScreenKey];
				const shouldRemove =
					entry.navigatorKey === branchNavigatorKey ||
					(entry.ancestorNavigatorKeys?.includes(branchNavigatorKey) ?? false);

				if (shouldRemove) {
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

function clearByBranch(branchNavigatorKey: NavigatorKey) {
	"worklet";
	if (!branchNavigatorKey) return;

	const beforeMatches = countRegistryMatchesByBranch(branchNavigatorKey);
	const beforePresenceMatches =
		countPresenceMatchesByBranch(branchNavigatorKey);

	clearRegistry({
		shouldRemoveSnapshot: (_snapshotKey, snapshot) => {
			return (
				snapshot.navigatorKey === branchNavigatorKey ||
				(snapshot.ancestorNavigatorKeys?.includes(branchNavigatorKey) ?? false)
			);
		},
		shouldRemoveLink: (link) => {
			return (
				matchesNavigatorKey(link.source, branchNavigatorKey) ||
				matchesNavigatorKey(link.destination, branchNavigatorKey)
			);
		},
	});

	clearPresenceByBranch(branchNavigatorKey);

	const afterMatches = countRegistryMatchesByBranch(branchNavigatorKey);
	const afterPresenceMatches = countPresenceMatchesByBranch(branchNavigatorKey);

	debugClearLog(
		`clearByBranch(${branchNavigatorKey}) snapshots=${beforeMatches.snapshots}->${afterMatches.snapshots} links=${beforeMatches.links}->${afterMatches.links} presence=${beforePresenceMatches}->${afterPresenceMatches}`,
	);
	debugStoreSizeLog(`clearByBranch(${branchNavigatorKey})`);
}

export { clear, clearByAncestor, clearByBranch };
