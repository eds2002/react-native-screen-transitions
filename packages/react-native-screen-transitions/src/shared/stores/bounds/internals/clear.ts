import { matchesNavigatorKey, matchesScreenKey } from "../helpers/matching";
import type { NavigatorKey, PresenceState, ScreenKey } from "../types";
import { presence, type RegistryState, registry } from "./state";

const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};

const clearByScreenKey = (
	screenKey: ScreenKey,
	includeDescendants: boolean,
) => {
	"worklet";

	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagState = state[tag];

			for (const snapshotKey in tagState.snapshots) {
				const snapshot = tagState.snapshots[snapshotKey];
				const shouldClearSnapshot =
					snapshotKey === screenKey ||
					(includeDescendants &&
						(snapshot.ancestorKeys?.includes(screenKey) ?? false));

				if (shouldClearSnapshot) {
					delete tagState.snapshots[snapshotKey];
				}
			}

			for (let i = tagState.linkStack.length - 1; i >= 0; i--) {
				const link = tagState.linkStack[i];
				const shouldClearLink =
					matchesScreenKey(link.source, screenKey) ||
					matchesScreenKey(link.destination, screenKey);

				if (shouldClearLink) {
					tagState.linkStack.splice(i, 1);
				}
			}

			if (!hasAnyKeys(tagState.snapshots) && tagState.linkStack.length === 0) {
				delete state[tag];
			}
		}

		return state;
	});

	presence.modify(<T extends PresenceState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagEntries = state[tag];

			for (const entryScreenKey in tagEntries) {
				const entry = tagEntries[entryScreenKey];
				const shouldClearPresence =
					entryScreenKey === screenKey ||
					(includeDescendants &&
						(entry.ancestorKeys?.includes(screenKey) ?? false));

				if (shouldClearPresence) {
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

const clearByNavigator = (branchNavigatorKey: NavigatorKey) => {
	"worklet";

	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagState = state[tag];

			for (const snapshotKey in tagState.snapshots) {
				const snapshot = tagState.snapshots[snapshotKey];
				const shouldClearSnapshot =
					snapshot.navigatorKey === branchNavigatorKey ||
					(snapshot.ancestorNavigatorKeys?.includes(branchNavigatorKey) ??
						false);

				if (shouldClearSnapshot) {
					delete tagState.snapshots[snapshotKey];
				}
			}

			for (let i = tagState.linkStack.length - 1; i >= 0; i--) {
				const link = tagState.linkStack[i];
				const shouldClearLink =
					matchesNavigatorKey(link.source, branchNavigatorKey) ||
					matchesNavigatorKey(link.destination, branchNavigatorKey);

				if (shouldClearLink) {
					tagState.linkStack.splice(i, 1);
				}
			}

			if (!hasAnyKeys(tagState.snapshots) && tagState.linkStack.length === 0) {
				delete state[tag];
			}
		}

		return state;
	});

	presence.modify(<T extends PresenceState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagEntries = state[tag];

			for (const entryScreenKey in tagEntries) {
				const entry = tagEntries[entryScreenKey];
				const shouldClearPresence =
					entry.navigatorKey === branchNavigatorKey ||
					(entry.ancestorNavigatorKeys?.includes(branchNavigatorKey) ?? false);

				if (shouldClearPresence) {
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
	clearByScreenKey(screenKey, false);
}

function clearByAncestor(ancestorKey: ScreenKey) {
	"worklet";
	clearByScreenKey(ancestorKey, true);
}

function clearByBranch(branchNavigatorKey: NavigatorKey) {
	"worklet";
	if (!branchNavigatorKey) return;

	clearByNavigator(branchNavigatorKey);
}

export { clear, clearByAncestor, clearByBranch };
