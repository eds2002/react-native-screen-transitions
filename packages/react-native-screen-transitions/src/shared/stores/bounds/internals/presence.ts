import type { BoundaryConfig, PresenceState, ScreenKey, TagID } from "../types";
import { debugStoreSizeLog, type GroupsState, groups, presence } from "./state";

function registerBoundaryPresence(
	tag: TagID,
	screenKey: ScreenKey,
	ancestorKeys?: ScreenKey[],
	boundaryConfig?: BoundaryConfig,
	navigatorKey?: string,
	ancestorNavigatorKeys?: string[],
) {
	"worklet";
	presence.modify(<T extends PresenceState>(state: T): T => {
		"worklet";
		const mutableState = state as PresenceState;
		let tagEntries = mutableState[tag];
		if (!tagEntries) {
			tagEntries = {};
			mutableState[tag] = tagEntries;
		}
		const currentEntry = tagEntries[screenKey];

		tagEntries[screenKey] = {
			count: (currentEntry?.count ?? 0) + 1,
			ancestorKeys: ancestorKeys ?? currentEntry?.ancestorKeys,
			boundaryConfig: boundaryConfig ?? currentEntry?.boundaryConfig,
			navigatorKey: navigatorKey ?? currentEntry?.navigatorKey,
			ancestorNavigatorKeys:
				ancestorNavigatorKeys ?? currentEntry?.ancestorNavigatorKeys,
		};

		return state;
	});
	debugStoreSizeLog(`registerBoundaryPresence(${tag},${screenKey})`);
}

function unregisterBoundaryPresence(tag: TagID, screenKey: ScreenKey) {
	"worklet";
	const tagEntries = presence.value[tag];
	if (!tagEntries) return;

	const currentEntry = tagEntries[screenKey];
	if (!currentEntry) return;

	presence.modify(<T extends PresenceState>(state: T): T => {
		"worklet";
		const mutableTagEntries = state[tag];
		const mutableEntry = mutableTagEntries?.[screenKey];
		if (!mutableTagEntries || !mutableEntry) return state;
		const nextCount = mutableEntry.count - 1;

		if (nextCount > 0) {
			mutableEntry.count = nextCount;
			return state;
		}

		delete mutableTagEntries[screenKey];

		for (const _remainingKey in mutableTagEntries) {
			return state;
		}

		delete state[tag];
		return state;
	});
	debugStoreSizeLog(`unregisterBoundaryPresence(${tag},${screenKey})`);
}

function hasBoundaryPresence(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const tagEntries = presence.value[tag];
	if (!tagEntries) return false;

	const direct = tagEntries[screenKey];
	if (direct && direct.count > 0) return true;

	for (const entryScreenKey in tagEntries) {
		const entry = tagEntries[entryScreenKey];
		if (entry.ancestorKeys?.includes(screenKey)) {
			return true;
		}
	}

	return false;
}

function getBoundaryPresence() {
	"worklet";
	return presence;
}

function getBoundaryConfig(
	tag: TagID,
	screenKey: ScreenKey,
): BoundaryConfig | null {
	"worklet";
	const tagEntries = presence.value[tag];
	if (!tagEntries) return null;

	const direct = tagEntries[screenKey];
	if (direct && direct.count > 0) {
		return direct.boundaryConfig ?? null;
	}

	for (const entryScreenKey in tagEntries) {
		const entry = tagEntries[entryScreenKey];
		if (entry.count <= 0) continue;
		if (entry.ancestorKeys?.includes(screenKey)) {
			return entry.boundaryConfig ?? null;
		}
	}

	return null;
}

function setGroupActiveId(group: string, id: string) {
	"worklet";
	groups.modify(<T extends GroupsState>(state: T): T => {
		"worklet";
		const mutableState = state as GroupsState;
		mutableState[group] = { activeId: id };
		return state;
	});
	debugStoreSizeLog(`setGroupActiveId(${group},${id})`);
}

function getGroupActiveId(group: string): string | null {
	"worklet";
	return groups.value[group]?.activeId ?? null;
}

function getGroups() {
	"worklet";
	return groups;
}

export {
	registerBoundaryPresence,
	unregisterBoundaryPresence,
	hasBoundaryPresence,
	getBoundaryPresence,
	getBoundaryConfig,
	setGroupActiveId,
	getGroupActiveId,
	getGroups,
};
